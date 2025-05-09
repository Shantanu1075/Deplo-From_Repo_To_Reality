const express = require('express')
const { generateSlug } = require('random-word-slugs')
const {ECSClient, RunTaskCommand} = require('@aws-sdk/client-ecs')
const { Server } = require('socket.io')
const cors = require('cors')
const { z } = require('zod')
const { PrismaClient } = require('@prisma/client')
const { createClient } =require('@clickhouse/client')
const { Kafka } = require('kafkajs')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('path')


const app = express()
const PORT = 9000


const prisma = new PrismaClient({ })

const io = new Server({ cors: '*' } )

const kafka = new Kafka({
    clientId: ``,
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

const consumer = kafka.consumer({ groupId: 'api-server-logs-consumer' })

const client = createClient({
    host: '',
    database: 'default',
    username: '',
    password: ''
})

io.on('connection', socket => {
    socket.on('subscribe', channel => {
        socket.join(channel)
        socket.emit('message',`Joined ${channel}`)
    })
})

io.listen(9002, () => console.log('Socket Server 9002'))


const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

const config = {
    CLUSTER: '',
    TASK: ''
}

app.use(express.json())
app.use(cors())

app.post('/Deplo', async (req, res) => {
    const schema = z.object({
        name: z.string(),
        gitURL: z.string()
    })
    const safeParseResult = schema.safeParse(req.body)
    
    if (safeParseResult.error) return res.status(400).json({ error: safeParseResult.error })

    const { name, gitURL } = safeParseResult.data

    const project = await prisma.project.create({
        data: {
            name,
            gitURL,
            subDomain:generateSlug()
        }
    })

    return res.json({ status: 'success', data: { project } })
})

app.post('/deploy',async (req, res) => {
    const { projectId } = req.body
    
    const project = await prisma.project.findUnique({ where: { id: projectId } })

    if (!project) return res.status(404).json({ error: 'Project not found' })
        
        const deployment = await prisma.deployement.create({
        data: {
            project: { connect: { id: projectId } },
            status: 'QUEUED'
        }
    })
    
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration:{
            awsvpcConfiguration:{
                assignPublicIp:'ENABLED',
                subnets: ['','',''],
                securityGroups: ['']
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'deplo-builder-image',
                    environment: [
                        {name: 'GIT_REPOSITORY_URL',value: project.gitURL },
                        {name: 'Project_ID',value: projectId },
                        {name: 'DEPLOYEMENT_ID',value: deployment.id },
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);

    return res.json({ status:'queued', data: { deploymentId: deployment.id}})
    
})

app.get('/logs/:id', async (req, res) => {
    const id = req.params.id;
    const logs = await client.query({
        query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
        query_params:{
            deployment_id: id
        },
        format: 'JSONEachRow'
    })

    const rawLogs = await logs.json()

    return res.json({ logs: rawLogs })
})

async function initkafkaConsumer() {
    await consumer.connect()
    await consumer.subscribe({ topic: 'container-logs' })

    await consumer.run({
        autoCommit: false,
        eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {
            const messages = batch.messages;
            console.log(`Recv. ${messages.length} messages...`)
            for (const message of messages) {
                try {
                    const stringMessage = message.value.toString()
                    const { Project_ID, DEPLOYEMENT_ID, log } = JSON.parse(stringMessage)
                    
                    // Store in ClickHouse
                    const { query_id } = await client.insert({
                        table: 'log_events',
                        values: [{ event_id: uuidv4(), deployment_id: DEPLOYEMENT_ID, log }],
                        format: 'JSONEachRow'
                    })
                    
                    // Emit to Socket.IO room
                    io.to(`container-logs`).emit('message', JSON.stringify({
                        Project_ID,
                        DEPLOYEMENT_ID,
                        log
                    }))
                    
                    resolveOffset(message.offset)
                    await commitOffsetsIfNecessary(message.offset)
                    await heartbeat()
                } catch (err) {
                    console.error('Error processing message:', err)
                }
            }
        }
    })
}

initkafkaConsumer()

app.listen(PORT, () => console.log(`API Server Running..${PORT}`))