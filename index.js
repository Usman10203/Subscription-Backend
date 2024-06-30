require("dotenv").config()
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey")
const express = require("express");
const app = express()
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 5000

app.use(express.json())
app.use(bodyParser.json())

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
});

const corsOptions = {
    origin: [
        "https://subscription-frontend.vercel.app/",
        "http://localhost:5173",
        "*",
    ],
    credentials: true,
    methods: 'GET,POST,DELETE,UPDATE,PUT,PATCH',
    optionsSuccessStatus: 200,
    preflightContinue: false,
    allowedHeaders: 'Content-Type,Authorization',

};

app.use(cors(corsOptions));

app.use("/api/v1/", require("./routes/stripeRoutes"));

app.get('/', (req, res) => {
    res.send({ title: 'Backend APP is Runnig' });
})
app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
})