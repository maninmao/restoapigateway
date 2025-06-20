const express = require('express');
const app = express()



//USE PROXY SERVER TO REDIRECT THE INCOMMING REQUEST
const httpProxy = require('http-proxy')
const proxy = httpProxy.createProxyServer();

const jwt = require('jsonwebtoken')
require('dotenv').config()
const JWT_SECRETE = process.env.JWT_SECRETE;

function authToken(req, res, next) {
    console.log(req.headers.authorization)
    const header = req?.headers.authorization;
    const token = header && header.split(' ')[1];

    if (token == null) return res.status(401).json("Please send token");

    jwt.verify(token, JWT_SECRETE, (err, user) => {
        if (err) return res.status(403).json("Invalid token", err);
        req.user = user;
        next()
    })
}

function authRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json("Unauthorized");
        }
        next();
    }
}

//REDIRECT TO THE STUDENT MICROSERVICE
app.use('/user',authToken, authRole('user'), (req, res) => {
    console.log("INSIDE API GATEWAY USER ROUTE")
    proxy.web(req, res, { target: 'http://34.227.222.63:5054' });
})

//REDIRECT TO THE TEACHER MICROSERVICE
app.use('/admin', authToken, authRole('admin'),(req, res) => {
    console.log("INSIDE API GATEWAY ADMIN ROUTE")
    proxy.web(req, res, { target: 'http://54.172.95.210:5053' });
})

//REDIRECT TO THE LOGIN(Authentication) MICROSERVICE
app.use('/auth', (req, res) => {
    proxy.web(req, res, { target: 'http://44.222.254.38:5051' });
})

app.use('/reg', (req, res) => {
    proxy.web(req, res, { target: 'http://44.222.254.38:5052' });
})  


app.listen(4000, () => {
    console.log("API Gateway Service is running on PORT NO : 4000")
})