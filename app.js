const express = require("express")
const connectDB = require("./db")
connectDB()
const app = express()

app.use('/api/users', require('./routes/userRoutes'))

app.listen(5001, ()=>{
    console.log(`Server running at localhost:5001`)
})