const express = require("express")
const connectDB = require("./db")
const cors = require("cors")
connectDB()
const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/users', require('./routes/userRoutes'))
app.use('/api/products', require('./routes/productRoutes'))
app.use('/api/orders', require('./routes/orderRoutes'))
app.use('/api/customers', require('./routes/customerRoutes'))
app.use('/api/dashboard', require('./routes/dashboardRoutes'))
app.use('/api/reports', require('./routes/reportsRoutes'))





app.listen(5001, ()=>{
    console.log(`Server running at localhost:5001`)
})