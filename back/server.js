require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Middlewares
app.use(express.json());
app.use(cors({ origin: "https://url-shortenercdrp.netlify.app/" }));

// CONEXIÓN MONGO
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.log(err));

//RUTAS
const urlRouter = require("./routes/url");
app.use("/api", urlRouter);

app.listen(process.env.PORT || 5000);
