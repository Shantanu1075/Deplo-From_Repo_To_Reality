const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
const PORT = 8000

const BASE_PATH = 'http://project-deplo.s3.ap-south-1.amazonaws.com/__outputs'

const proxy = httpProxy.createProxy()

app.use((req, res) => {
    const hostname = req.hostname;
    // For local development, use localhost:8000 directly
    const subdomain = hostname.includes('localhost')
        ? req.headers.host.split('.')[0].replace(':8000', '')
        : hostname.split('.')[0];

    const resolvesTo = `${BASE_PATH}/${subdomain}`

    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true})
})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if(url === '/')
        proxyReq.path += 'index.html'
})

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`))