const express=require('express'),
const http=require('http')
const hostname='localhost'
const port=8080
const server=http.createServer((req,res)=> {
    res.writeHead(200,{"content-type": "text"})
    res.end("hello")
})
server.listen(3000,()=>{
    console.log("server running")
})