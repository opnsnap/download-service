import * as dotenv from "dotenv";
import express from "express";

dotenv.config({ path: __dirname + '/../.env' });

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use('/dsvc/healthcheck', require('express-healthcheck')());
