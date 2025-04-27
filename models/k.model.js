const mongoose = require('mongoose')

const KmodelSchema = mongoose.Schema(
    {
        version: {
            type: String,
            required: false
        },
        user: {
            type: String,
            required: false
        },
        dateGenerated: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false
        },
        data: {
            type: Array,
            required: false
        },
    },
    {
        timestamp: true
    }
);

const SimpleKmodelSchema = mongoose.Schema(
    {
        date: {
            type: Date,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    },
    {
        timestamp: true
    }
);

const Kmodel = mongoose.model("Kmodel", KmodelSchema);
const SimpleKmodel = mongoose.model("SimpleKmodel", SimpleKmodelSchema);

module.exports = Kmodel;
module.exports = SimpleKmodel;
