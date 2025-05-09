const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const mime = require('mime-types')
const { Kafka } = require('kafkajs')

const Project_ID = process.env.Project_ID
const DEPLOYEMENT_ID = process.env.DEPLOYEMENT_ID

const kafka = new Kafka({
    clientId: `docker-build-derver-${Project_ID}`,
    brokers: [''],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, 'kafka.pem'), 'utf-8')],
    },
    sasl: {
        username: '',
        password: '',
        mechanism: 'plain'
    }
})

const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const producer = kafka.producer()

async function publishLog(log) {
    await producer.send({ topic: `container-logs`, messages: [{key:'log', value: JSON.stringify({ Project_ID, DEPLOYEMENT_ID, log })}] })
}

async function init() {
    await producer.connect()
    console.log('Executing script.js')
    await publishLog(`Build Started...`)
    const Output_Dir_Path = path.join(__dirname, 'output')

    await publishLog(`Cleaning up previous installations...`)
    const cleanCmd = `cd ${Output_Dir_Path} && rm -rf node_modules package-lock.json && npm install`
    await publishLog(`Running: ${cleanCmd}`)

    const installExitCode = await new Promise((resolve) => {
        const installProcess = exec(cleanCmd)
        
        installProcess.stdout.on('data', async (data) => {
            console.log(data.toString())
            await publishLog(data.toString())
        })
        
        installProcess.stderr.on('data', async (data) => {
            console.error(data.toString())
            await publishLog(`Install Error: ${data.toString()}`)
        })
        
        installProcess.on('close', (code) => resolve(code))
    })

    if (installExitCode !== 0) {
        console.error('npm install failed with code', installExitCode)
        await publishLog(`npm install failed with code ${installExitCode}`)
        process.exit(1)
    }

    await publishLog(`Running build...`)
    const buildExitCode = await new Promise((resolve) => {
        const buildProcess = exec(`cd ${Output_Dir_Path} && npm run build`)
        
        buildProcess.stdout.on('data', async (data) => {
            console.log(data.toString())
            await publishLog(data.toString())
        })
        
        buildProcess.stderr.on('data', async (data) => {
            console.error(data.toString())
            await publishLog(`Build Error: ${data.toString()}`)
        })
        
        buildProcess.on('close', (code) => resolve(code))
    })

    if (buildExitCode !== 0) {
        console.error('Build failed with code', buildExitCode)
        await publishLog(`Build failed with code ${buildExitCode}`)
        process.exit(1)
    }

    await publishLog(`Build Complete - Looking for output directory...`)
    
    const possibleOutputDirs = ['dist', 'build', 'out', 'public']
    let outputFolderPath = null

    for (const dir of possibleOutputDirs) {
        const dirPath = path.join(Output_Dir_Path, dir)
        if (fs.existsSync(dirPath)) {
            outputFolderPath = dirPath
            break
        }
    }

    if (!outputFolderPath) {
        console.error('Could not find any output directory (tried:', possibleOutputDirs.join(', '), ')')
        await publishLog(`Could not find any output directory (tried: ${possibleOutputDirs.join(', ')})`)
        process.exit(1)
    }

    await publishLog(`Found output in: ${outputFolderPath}`)
    const Dist_Folder_Contents = fs.readdirSync(outputFolderPath, { recursive: true })

    await publishLog(`Starting to upload ${Dist_Folder_Contents.length} files...`)
    for (const file of Dist_Folder_Contents) {
        const filepath = path.join(outputFolderPath, file)
        if (fs.lstatSync(filepath).isDirectory()) continue

        console.log('Uploading', filepath)
        await publishLog(`Uploading ${file}`)

        const command = new PutObjectCommand({
            Bucket: 'project-deplo',
            Key: `__outputs/${Project_ID}/${file}`,
            Body: fs.createReadStream(filepath),
            ContentType: mime.lookup(filepath)
        })

        await s3Client.send(command)
        await publishLog(`Uploaded ${file}`)
        console.log('Uploaded', filepath)
    }

    await publishLog(`Deployment completed successfully`)
    console.log('Done...')
    process.exit(0)
}

init()