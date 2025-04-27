const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const Kmodel = require('./models/k.model.js');
const SimpleKmodel = require('./models/k.model.js');
require('dotenv').config()
const app = express()

app.use(express.json());


app.get('/api/kindex', async (req, res) => {
    try {
        console.log(process.env.upload_request)
        const k_models = await SimpleKmodel.find({})
        res.status(200).json(k_models)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/kindex/3d', async (req, res) => {
    try {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        today.setHours(3,0,0,0);
        const k_model = await SimpleKmodel.find({date:{
            $gte: today
        }}).limit(3).sort({date: 1});
        res.status(200).json(k_model)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/kindex/27d', async (req, res) => {
    try {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        today.setHours(3,0,0,0);
        const k_model = await SimpleKmodel.find({date:{
            $gte: today
        }}).limit(27).sort({date: 1});
        res.status(200).json(k_model)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.post('/api/kindex', async (req, res) => {
    try {
        const k_model = await SimpleKmodel.create(req.body);
        res.status(201).json(k_model)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/uplaod_kindex', (req, res) => {
    request(
        process.env.upload_request,
        (err, response, body) => {
            if (err)
                return res
                    .status(500)
                    .send({message: err});
            console.log(JSON.parse(body).data[0].coordinates[0].dates);
            
            return res.send(JSON.parse(body).data[0].coordinates[0].dates);
        }
    );
});

mongoose.connect(process.env.mongo_connection_string)
.then(() => {
    console.log('Connected!');
    app.listen(process.env.PORT, () => {
        console.log('server is running on 3000')
    });
}).catch(() => {
    console.log("Connection failed!")
});
