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

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
      const reviewCollection = client.db("hexa_tools").collection("reviews");

      // Verify JWT middleware
      const jwtVerify = (req, res, next) => {
         const authHeader = req.headers.authorization;
         if (!authHeader) {
            return res.status(401).send({ message: "Unauthorize access!" });
         }
         const token = authHeader.split(" ")[1];
         jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            function (error, decoded) {
               if (error) {
                  return res.status(403).send({ message: "Forbidden access!" });
               }
               req.decoded = decoded;
               next();
            }
         );
      };

      //    Verify Admin middleware

      const verifyAdmin = async (req, res, next) => {
         const requesterEmail = req.decoded.email;
         const requesterUser = await userCollection.findOne({
            email: requesterEmail,
         });
         if (requesterUser.role === "admin") {
            next();
         } else {
            res.status(403).send({ message: "Forbidden access!" });
         }
      };

      // Put api to add user
      app.put("/user/:email", async (req, res) => {
         const email = req.params.email;
         const data = req.body;
         const filter = { email: email };
         const options = { upsert: true };
         const updateDoc = {
            $set: data,
         };
         const result = await userCollection.updateOne(
            filter,
            updateDoc,
            options
         );
         const token = jwt.sign(
            { email: email },
            process.env.ACCESS_TOKEN_SECRET
         );
         res.send({ token, result });
      });

      // Get api to read all products
      app.get("/product", async (req, res) => {
         const query = req.query;
         const products = await productCollection.find(query).toArray();
         res.send(products);
      });

      // Get api to read one product
      app.get("/product/:id", async (req, res) => {
         const id = req.params.id;
         const filter = { _id: ObjectId(id) };
         const product = await productCollection.findOne(filter);
         res.send(product);
      });

      // Post api to add product
      app.post("/product", jwtVerify, async (req, res) => {
         const data = req.body;
         const result = await productCollection.insertOne(data);
         res.send(result);
      });

      // Delete api to delete one product
      app.delete("/product/:id", jwtVerify, async (req, res) => {
         const id = req.params.id;
         const filter = { _id: ObjectId(id) };
         const result = await productCollection.deleteOne(filter);

         res.send(result);
      });

      // Patch api to add user
      app.patch("/product/:id", async (req, res) => {
         const id = req.params.id;
         const data = req.body;
         const filter = { _id: ObjectId(id) };
         const updateDoc = {
            $set: data,
         };
         const result = await productCollection.updateOne(
            filter,
            updateDoc
         );

         res.send(result);
      });

      // Post api to add user review
      app.post("/review", jwtVerify, async (req, res) => {
         const data = req.body;
         const result = await reviewCollection.insertOne(data);
         res.send(result);
      });

      // Get api to read all reviews
      app.get("/review", async (req, res) => {
         const query = req.query;
         const products = await reviewCollection
            .find(query)
            .sort({ _id: -1 })
            .toArray();
         res.send(products);
      });

      // Get api to read all users
      app.get("/user", jwtVerify, async (req, res) => {
         const query = req.query;
         const cursor = userCollection.find(query);
         const services = await cursor.toArray();
         res.send(services);
      });

      // Get api to read check admin

      app.get("/admin/:email", jwtVerify, async (req, res) => {
         const email = req.params.email;
         const user = await userCollection.findOne({ email: email });
         const isAdmin = user.role === "admin";

         res.send({ admin: isAdmin });
      });

      // Post api to insert order
      app.post("/order", async (req, res) => {
         const data = req.body;
         const query = {
            product: data.product,
            date: data.date,
            email: data.email,
         };
         const exists = await appointmentCollection.findOne(query);
         if (exists) {
            return res.send({ success: false, appointment: exists });
         } else {
            const result = await appointmentCollection.insertOne(data);
            return res.send({ success: true, result });
         }
      });

      // Get api to read all orders
      app.get("/order", jwtVerify, async (req, res) => {
         const query = req.query;
         const email = req.query.email;
         const page = req.query.page;
         const decodedEmail = req.decoded.email;
         if (email === decodedEmail) {
            const cursor = appointmentCollection.find(query);
            const myAppointments = await cursor.toArray();
            res.send(myAppointments);
         } else {
            res.status(403).send({ message: "Forbidden access!" });
         }
      });
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
