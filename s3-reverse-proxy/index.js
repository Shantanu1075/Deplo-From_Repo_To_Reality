const express = require('express')
const httpProxy = require('http-proxy')
const { PrismaClient } = require('@prisma/client')

const app = express()
const PORT = 8000

const BASE_PATH = ''
const proxy = httpProxy.createProxy()
const prisma = new PrismaClient()

// Error handling middleware
app.use(async (err, req, res, next) => {
  console.error(err)
  res.status(500).send('Internal Server Error')
})

app.use(async (req, res, next) => {
  try {
    const hostname = req.hostname
    const subdomain = hostname.split('.')[0]

    const project = await prisma.project.findUnique({ 
      where: { subDomain: subdomain } 
    })
    
    if (!project) {
      return res.status(404).send('Project not found')
    }
    
    const resolvesTo = `${BASE_PATH}/${project.id}`
    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true })
  } catch (err) {
    next(err)
  }
})

proxy.on('proxyReq', (proxyReq, req, res) => {
  const url = req.url
  if (url === '/') {
    proxyReq.path += 'index.html'
  }
})

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`))

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})