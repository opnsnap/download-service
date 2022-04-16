import * as dotenv from "dotenv";
import express from "express";
import { Client } from "minio";

dotenv.config({ path: __dirname + '/../.env' });

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use('/dsvc/healthcheck', require('express-healthcheck')());

const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: parseInt((process.env.MINIO_PORT) ? process.env.MINIO_PORT : "9000", 10),
    useSSL: (process.env.MINIO_SECURE === 'true'),
    accessKey: process.env.MINIO_ACCESSKEY!,
    secretKey: process.env.MINIO_SECRETKEY!
});

app.get('/dsvc/presignedUrl', (req, res) => {
    const fileName = req.query.fileName as string;
    if (!fileName) {
        res.status(400).send("Missing fileName");
        return;
    }

    minioClient.presignedGetObject(
        process.env.MINIO_BUCKET!,
        fileName,
        10 * 60 /* 10 minutes */,
        (err, presignedUrl) => {
            if (err) {
                res.status(500);
                res.send({
                    error: err.toString()
                });
            } else {
                res.status(200);
                res.send({
                    url: presignedUrl
                });
            }
            res.end();
        })
});

minioClient.bucketExists(process.env.MINIO_BUCKET!, function (error: any, exists: boolean) {
    if (error) {
        return console.log(error);
    }

    if (exists) {
        app.listen(process.env.PORT || 8080, () => {
            console.log(`Server is running on port ${process.env.PORT || 8080}`);
        });
    } else {
        return console.log(`Bucket "${process.env.MINIO_BUCKET}" doesn't exist! Please change the configuration or create the bucket.`);
    }
});
