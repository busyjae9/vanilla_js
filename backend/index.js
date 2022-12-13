import express from "express";
import user_1 from './apis/users/users_1.js'

const app = express()

app.use(express.json())

app.use(express.urlencoded({extended: false}))

app.use("/users/v1", user_1)

app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.listen(6584)