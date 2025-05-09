"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from "lucide-react";
import { Fira_Code } from "next/font/google";
import axios from "axios";

const socket = io("http://localhost:9002");
const firaCode = Fira_Code({ subsets: ["latin"] });

export default function Home() {
  const [repoURL, setRepoURL] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [deploymentId, setDeploymentId] = useState<string | undefined>();
  const [deployPreviewURL, setDeployPreviewURL] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLElement>(null);

  const isValidURL: [boolean, string | null] = useMemo(() => {
    if (!repoURL || repoURL.trim() === "") return [false, null];
    const regex = new RegExp(
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/
    );
    return [regex.test(repoURL), "Enter valid GitHub Repository URL"];
  }, [repoURL]);

  const handleClickDeploy = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setLogs([]); // Clear previous logs

    try {
      // 1. Create the project
      const repoMatch = repoURL.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      const projectName = repoMatch ? repoMatch[2] : `project-${Date.now()}`;

      const projectResponse = await axios.post(`http://localhost:9000/Deplo`, {
        name: projectName,
        gitURL: repoURL,
      });

      if (!projectResponse.data?.data?.project) {
        throw new Error("Failed to create project");
      }

      const { project } = projectResponse.data.data;
      setProjectId(project.id);
      setDeployPreviewURL(`http://${project.subDomain}.localhost:8000`);

      // 2. Start the deployment
      const deploymentResponse = await axios.post(`http://localhost:9000/deploy`, {
        projectId: project.id,
      });

      if (!deploymentResponse.data?.data?.deploymentId) {
        throw new Error("Failed to start deployment");
      }

      const { deploymentId } = deploymentResponse.data.data;
      setDeploymentId(deploymentId);

      // 3. Subscribe to logs
      console.log(`Subscribing to logs:${deploymentId}`);
      socket.emit("subscribe", `container-logs`); // Changed to container-logs topic

    } catch (err: any) {
      console.error("Error:", err.response?.data || err.message);
      setErrorMessage(err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [repoURL]);

  const handleSocketIncommingMessage = useCallback((message: string) => {
    console.log(`[Socket Message]:`, message);
    try {
      const parsed = JSON.parse(message);
      if (parsed.Project_ID === projectId || parsed.DEPLOYEMENT_ID === deploymentId) {
        setLogs((prev) => [...prev, parsed.log]);
        logContainerRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (e) {
      console.error("Failed to parse log:", message);
    }
  }, [projectId, deploymentId]);

  useEffect(() => {
    socket.on("message", handleSocketIncommingMessage);
    return () => {
      socket.off("message", handleSocketIncommingMessage);
    };
  }, [handleSocketIncommingMessage]);

  return (
    <main className="flex justify-center items-center h-screen px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Github className="w-6 h-6" />
          Deploy your GitHub project
        </h1>

        <Input
          disabled={loading}
          value={repoURL}
          onChange={(e) => setRepoURL(e.target.value)}
          type="url"
          placeholder="https://github.com/username/repository"
          className="mb-3"
        />

        <Button
          onClick={handleClickDeploy}
          disabled={!isValidURL[0] || loading}
          className="w-full"
        >
          {loading ? "Deploying..." : "Deploy"}
        </Button>

        {errorMessage && (
          <p className="text-red-500 mt-2">{errorMessage}</p>
        )}

        {deployPreviewURL && (
          <div className="mt-4 bg-gray-900 text-white p-4 rounded-lg">
            <p>
              Deployment Preview:{" "}
              <a
                href={deployPreviewURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline"
              >
                {deployPreviewURL}
              </a>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Note: It may take a few minutes for the deployment to complete.
            </p>
          </div>
        )}

        {logs.length > 0 && (
          <div
            className={`${firaCode.className} mt-5 text-sm text-green-500 logs-container border border-green-500 rounded-lg p-4 h-[300px] overflow-y-auto`}
          >
            <pre className="flex flex-col gap-1">
              {logs.map((log, i) => (
                <code
                  ref={logs.length - 1 === i ? logContainerRef : undefined}
                  key={i}
                >{`> ${log}`}</code>
              ))}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}