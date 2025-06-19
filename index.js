const express = require('express');
const mongoose = require('mongoose');
const request = require('request');
const Model = require('./models/k.model.js');
const cron = require('cron');
require('dotenv').config();

const app = express()
app.use(express.json());
const cronJobs = [];

process.on('SIGTERM', () => {
    cronJobs.forEach(cronJob => cronJob.stop());
});

app.get('/api/kindex', async (req, res) => {
    try {
        const k_models = await Model.SimpleKmodel.find({})
        res.status(200).json(k_models)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/kindex/27d', async (req, res) => {
    try {
        const k_model = await Model.SimpleKmodel.find().sort({date: -1}).limit(28);
        k_model.reverse()
        res.status(200).json(k_model)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});


/**
 * func that are creating date ISOString with current year
 * from date strings (e.g. "May 4")
 */
function make_date(date_string) {
    const event = new Date(Date.parse(date_string))
    const current_year = new Date().getFullYear()
    event.setUTCFullYear(current_year)
    const event_utc = new Date(event.getTime() - event.getTimezoneOffset() * 60000)
    return event_utc

}

/**
 * this func will create new forecast object or update it if 
 * there is one for this unique date
 * @param {*} body - array with kindex forecast info 
 */
async function create_or_update(body) {
    for (let i = 0; i < body.length; i++) {
        const filter = { date: body[i].date };
        const update = body[i];
        await Model.SimpleKmodel.findOneAndUpdate(filter, update, { upsert: true })
    }
}

async function create_or_update_3d(body) {
    for (let i = 0; i < body.length; i++) {
        const filter = { date: body[i].date };
        const update = body[i];
        await Model.SimpleKmodel3d.findOneAndUpdate(filter, update, { upsert: true })
    }
}

app.post('/api/kindex', async (req, res) => {
    try {
        await create_or_update(req.body)
        res.status(201).json(req.body)
    } catch (error) {
        console.log(error)
        res.status(500).json({message: error.message});
    }
});

app.get('/api/kindex/direct_3d', (req, res) => {
    try {
        request(
            "https://services.swpc.noaa.gov/text/3-day-forecast.txt",
            (err, response, body) => {
                if (err)
                    return res.status(500).send({message: err});
                const the_day_forecast = body.split("\n")
                const dates = the_day_forecast[13].trim(" ").split("       ")

                const kindex_nums = []
                for (let i = 14; i < 22; i++) {
                    let str = the_day_forecast[i];
                    let matches = str.match(/\d+(\.\d+)/g);
                    kindex_nums.push(matches);
                }

                kindex_nums_by_days = []
                for (let i = 0; i < 3; i++) {
                    let temp = []
                    for (let j = 0; j < kindex_nums.length; j++) {
                        temp.push(parseFloat(kindex_nums[j][i]))
                    }
                    kindex_nums_by_days.push(temp)
                }

                const start_date = make_date(dates[0])

                return res.send({
                    start_date: start_date,
                    kindex_nums: kindex_nums_by_days
                });
            }
        );
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/kindex/3d', async (req, res) => {
    try {
        const k_model_3d = await Model.SimpleKmodel3d.find({}).select({ date: 1, value: 1, _id: 0 }).sort({date: -1}).limit(4);
        k_model_3d.reverse()
        response_data = {
            "start_date": k_model_3d[0].date,
            "kindex_nums": [
                k_model_3d[0].value,
                k_model_3d[1].value,
                k_model_3d[2].value,
                k_model_3d[3].value,
            ]
        }
        res.status(200).json(response_data)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

app.get('/api/kindex/direct_27d', (req, res) => {
    try {
        request(
            "https://services.swpc.noaa.gov/text/27-day-outlook.txt",
            (err, response, body) => {
                if (err)
                    return res.status(500).send({message: err});
                const the_day_forecast = body.split("\n")

                const kindex_nums = []
                for (let i = 11; i < 38; i++) {
                    let str = the_day_forecast[i];
                    let matches = str.match(/\d+/g);
                    kindex_nums.push(parseInt(matches[matches.length - 1]));
                }
                const start_date = make_date(the_day_forecast[11].slice(0, 11))

                return res.send({
                    start_date: start_date,
                    kindex_nums: kindex_nums
                });
            }
        );
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

/**
 * func for retrieving data from the source
 * @param {*} res - response obj for api get request, optional
 */
function update_from_source_27d(res) {
    request(
        "https://services.swpc.noaa.gov/text/27-day-outlook.txt",
        (err, response, body) => {
            if (err)
                return res.status(500).send({message: err});
            try {
                const the_day_forecast = body.split("\n")
            
                objects_to_add = []
                for (let i = 11; i < 38; i++) {
                    let str = the_day_forecast[i];
                    let matches = str.match(/\d+/g);
                    let value = matches[matches.length - 1]
                    let date = make_date((the_day_forecast[i].slice(0, 11)))
                    objects_to_add.push({date: date, value: value})
                }
                create_or_update(objects_to_add)

                if (typeof res !== "undefined") {
                    return res.send(objects_to_add);
                }
            } catch (error) {
                res.status(500).json({message: error.message});
            }
        }
    );
}

function update_from_source_3d(res) {
    request(
        "https://services.swpc.noaa.gov/text/3-day-forecast.txt",
        (err, response, body) => {
            if (err)
                return res.status(500).send({message: err});
            try {
                const the_day_forecast = body.split("\n")
                const dates = the_day_forecast[13].trim(" ").split("       ")

                const utc_date_objs = []
                for (let i = 0; i < dates.length; i++) {
                    utc_date_objs.push(make_date(dates[i]));
                }

                const kindex_nums = []
                for (let i = 14; i < 22; i++) {
                    let str = the_day_forecast[i];
                    let matches = str.match(/\d+(\.\d+)/g);
                    kindex_nums.push(matches);
                }

                kindex_nums_by_days = []
                for (let i = 0; i < 3; i++) {
                    let temp = []
                    for (let j = 0; j < kindex_nums.length; j++) {
                        temp.push(parseFloat(kindex_nums[j][i]))
                    }
                    kindex_nums_by_days.push(temp)
                }

                objects_to_add = []
                for (let i = 0; i < 3; i++) {
                    let value = kindex_nums_by_days[i]
                    let date = utc_date_objs[i]
                    objects_to_add.push({date: date, value: value})
                }

                create_or_update_3d(objects_to_add)
                
                if (typeof res !== "undefined") {
                    return res.send(objects_to_add);
                }
            } catch (error) {
                res.status(500).json({message: error.message});
            }
        }
    )
}

app.get('/api/uplaod_kindex', (req, res) => {
    try {
        update_from_source_27d();
        update_from_source_3d(res);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

cronJobs.push(
    new cron.CronJob(
        '0 * * * *', // Schedule: Hourly
        () => {
            update_from_source_27d();
            update_from_source_3d();
        },
        null,
        true
    )
);

mongoose.connect(process.env.mongo_connection_string)
.then(() => {
    console.log('Connected!');
    app.listen(process.env.PORT, () => {
        console.log('server is running on 3000')
    });
}).catch(() => {
    console.log("Connection failed!")
});
