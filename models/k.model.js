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
            index: true,
            unique: true,
            required: true,
        },
        value: {
            type: Number,
            required: true
        }
    },
    {
        timestamp: true
    }
);

const SimpleKmodelSchema3d = mongoose.Schema(
    {
        date: {
            type: Date,
            required: true
        },
        value: {
            type: Number,
            required: true
        }
    },
    {
        timestamp: true
    }
);

const Kmodel = mongoose.model("Kmodel", KmodelSchema);
const SimpleKmodel = mongoose.model("SimpleKmodel", SimpleKmodelSchema);
const SimpleKmodel3d = mongoose.model("SimpleKmodel3d", SimpleKmodelSchema3d);

module.exports = { Kmodel, SimpleKmodel, SimpleKmodel3d }
