const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 4000;

//Use Middleware
app.use(cors());
app.use(express.json());

//Mongodb Connection

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0tgfo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   serverApi: ServerApiVersion.v1,
});

async function run() {
   try {
      await client.connect();
      const productCollection = client.db("hexa_tools").collection("products");
      const orderCollection = client.db("hexa_tools").collection("orders");
      const userCollection = client.db("hexa_tools").collection("users");

     
   } finally {
   }
}
run().catch(console.dir);

app.get("/", (req, res) => {
   res.send("Welcome to Hexa Tools Server!");
});

app.listen(port, () => {
   console.log(`Server is running on ${port}`);
});
