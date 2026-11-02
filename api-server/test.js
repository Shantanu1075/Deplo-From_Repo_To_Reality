const { Kafka } = require('kafkajs')
const fs = require('fs')
const path = require('path')

require('dotenv').config({
    path: path.join(__dirname, '..', '.env')
})

const kafka = new Kafka({
    clientId: 'kafka-test',

    brokers: process.env.KAFKA_BROKERS.split(','),

    ssl: {
        ca: [
            fs.readFileSync(
                path.join(__dirname, '..', 'certs', 'kafka.pem'),
                'utf-8'
            )
        ]
    },

    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD
    },

    connectionTimeout: 10000,
    authenticationTimeout: 10000,
    requestTimeout: 30000,

    retry: {
        initialRetryTime: 300,
        retries: 5
    }
})

async function testKafka() {
    const admin = kafka.admin()

    try {
        console.log('Connecting to Kafka...')

        await admin.connect()

        console.log('Kafka connected successfully!')

        const topics = await admin.listTopics()

        console.log('Kafka topics:')
        console.log(topics)

        await admin.disconnect()

        console.log('Kafka disconnected successfully!')
    } catch (error) {
        console.error('Kafka connection failed:')
        console.error(error)
    }
}

testKafka()