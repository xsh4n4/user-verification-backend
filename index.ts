/** @format */

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import auth from './routes/auth.js'

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(morgan("tiny"));

const port = 5000;

app.use(express.json())
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use('/uploads', express.static(path.join(__dirname, "../uploads")));

app.use('/api', auth)

app.get('/admin', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/verification', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/login', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})

mongoose.set("strictQuery", false);
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/voter";

async function run() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to Mongo :", error);
  }
}

run()