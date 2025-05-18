const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const Model = require('./models/k.model.js');
require('dotenv').config()
const app = express()

app.use(express.json());


app.get('/api/kindex', async (req, res) => {
    try {
        const k_models = await Model.SimpleKmodel.find({})
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
        const k_model = await Model.SimpleKmodel.find({date:{
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
        const k_model = await Model.SimpleKmodel.find({date:{
            $gte: today
        }}).limit(27).sort({date: 1});
        res.status(200).json(k_model)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.post('/api/kindex', async (req, res) => {
    try {
        const k_model = await Model.SimpleKmodel.create(req.body);
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

function make_date(date_string) {
    const event = new Date(Date.parse(date_string))
    const current_year = new Date().getFullYear()
    event.setUTCFullYear(current_year)
    const event_utc = new Date(event.getTime() - event.getTimezoneOffset() * 60000)
    return event_utc

}

app.get('/api/kindex/wide_3d', (req, res) => {
    try {
        request(
            "https://services.swpc.noaa.gov/text/3-day-forecast.txt",
            (err, response, body) => {
                if (err)
                    return res.status(500).send({message: err});
                const the_day_forecast = body.split("\n")
                const dates = the_day_forecast[13].trim(" ").split("       ")
                console.log(dates)

                // const utc_date_objs = []
                // for (let i = 0; i < dates.length; i++) {
                //     utc_date_objs.push(make_date(dates[i]));
                // }
                // console.log(utc_date_objs)

                const kindex_nums = []
                for (let i = 14; i < 22; i++) {
                    let str = the_day_forecast[i];
                    let matches = str.match(/\d+(\.\d+)/g);
                    kindex_nums.push(matches);
                }
                console.log(kindex_nums)

                kindex_nums_by_days = []
                for (let i = 0; i < 3; i++) {
                    let temp = []
                    for (let j = 0; j < kindex_nums.length; j++) {
                        temp.push(parseFloat(kindex_nums[j][i]))
                    }
                    kindex_nums_by_days.push(temp)
                }
                console.log(kindex_nums_by_days)

                // const complete_data = []
                // for (let i = 0; i < utc_date_objs.length; i++) {
                //     for (let j = 0; j < 22; j+=3) {
                //         console.log(utc_date_objs[i], j)
                //     }
                // }

                return res.send(kindex_nums_by_days);
            }
        );
    } catch (error) {
        res.status(500).json({message: error.message});
    }
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
