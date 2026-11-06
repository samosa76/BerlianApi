require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const db = require('./Database/conn')
const HardwareRouter = require('./Routes/HardwareRoutes')
const ReportRoutes = require('./Routes/ReportRoutes')
const app = express()

app.use(cors())
app.use(bodyParser.json())


/**
 * Hardware Router
 */

// Physical Hardware 
app.all('/api/hardware', HardwareRouter)


// Physical Hardware Status
app.get('/api/hardware/:category_id', HardwareRouter)

// Physical Hardware Type
app.all('/api/hardware-type', HardwareRouter)

// Location List
app.all('/api/hardware-location', HardwareRouter)

/**
 * Reports Routes
 */

// Health Reports
app.all('/api/health-report', ReportRoutes)
app.all('/api/health-report/:category_id', ReportRoutes)

// Single Hardware Report
app.all('/api/health-report/asset/:asset_id', ReportRoutes)


// Report Parameter
app.all('/api/report-parameter/:hardware_type_id', ReportRoutes)
app.all('/api/report-parameter/', ReportRoutes)

// Categories Report
app.all('/api/report-categories', ReportRoutes)

// Hardware Checklist
app.all('/api/report-checklist/:category_id', ReportRoutes)


app.listen(process.env.PORT, '0.0.0.0', (err) => {
    if(err) console.log('Something went wrong');
    console.log(`Listening on port: ${process.env.PORT}`);
})