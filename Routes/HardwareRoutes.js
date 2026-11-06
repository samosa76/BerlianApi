const express = require('express')
const response = require('../Response/response')
const db = require('../Database/conn')

const HardwareRouter = express.Router()

/**
 * Hardware Type
 */
HardwareRouter.get('/api/hardware-type', async (req, res) => {
    try {

        const sql = 'SELECT * FROM hardware_types'
        const [result] = await db.query(sql)

        if (result.length > 0) {
            return response(res, 200, result, "Hardware Types")
        } else {
            return response(res, 200, [], "Empty Table")
        }

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

HardwareRouter.post('/api/hardware-type', async (req, res) => {
    const { name, description } = req.body || {}
    try {

        if (!name) {
            return response(res, 400, null, 'Data cannot be null')
        }

        const sql = 'INSERT INTO hardware_types (name, description) VALUES (?, ?)'
        const [result] = await db.query(sql, [name, description])

        return response(res, 201, result, 'Add new hardware type')

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

/**
 * Hardware Location
 */
HardwareRouter.get('/api/hardware-location', async (req, res) => {
    const sql = `
    SELECT
        loc.*, 
        rc.name AS category_report, 
        ht.name AS hardware_type
    FROM install_locations loc
    LEFT JOIN report_categories rc ON loc.category_id = rc.id
    LEFT JOIN hardware_types ht ON loc.hardware_type_id = ht.id
    `

    try {
        const [result] = await db.query(sql)

        if (result.length > 0) {
            return response(res, 200, result, "Lists Hardware")
        } else {
            return response(res, 200, [], "Empty Table")
        }
    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

HardwareRouter.post('/api/hardware', async (req, res) => {
    const { serial_number, current_location_id, hardware_type_id, status } = req.body;
    
    try {
        // 1. Check for missing data
        if (!serial_number || !current_location_id || !hardware_type_id) {
            return response(res, 400, null, 'Data cannot be null');
        }

        // 2. Validate that the Hardware Type exists
        const [hardwareTypeRows] = await db.query('SELECT * FROM hardware_types WHERE id=?', [hardware_type_id]);
        if (hardwareTypeRows.length === 0) {
            return response(res, 400, null, 'Hardware Type ID does not exist');
        }

        // 3. Validate that the Location exists
        const [locationRows] = await db.query('SELECT * FROM install_locations WHERE id=?', [current_location_id]);
        if (locationRows.length === 0) {
            return response(res, 400, null, 'Location ID does not exist');
        }

        // 4. Insert the new hardware asset
        const sql = 'INSERT INTO hardware_assets (serial_number, current_location_id, hardware_type_id, status) VALUES (?, ?, ?, ?)';
        
        // Default to 'active' if the frontend doesn't send a status
        const [result] = await db.query(sql, [serial_number, current_location_id, hardware_type_id, status || 'active']);

        return response(res, 200, result, 'Add new hardware asset');

    } catch (error) {
        return response(res, 500, null, `${error}`);
    }
});

/**
 * Hardware List
 */

HardwareRouter.get('/api/hardware/', async (req, res) => {
    try {

        

        const sqlAll = `
        SELECT
            ha.id,
            ha.hardware_type_id,
            ha.serial_number,
            ha.status,
            ha.current_location_id,
            il.location_name
        FROM hardware_assets ha
        LEFT JOIN install_locations il ON ha.current_location_id = il.id
        `
        const [allResult] = await db.query(sqlAll)

        if (allResult.length === 0) {
            return response(res, 200, [], `Empty Table`)
        }

        // Get the location by the id and set the name so it will return location_name instead of id
        
        return response(res, 200, allResult, 'All Hardware Data')

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }

})
HardwareRouter.get('/api/hardware/:hardware_type_id', async (req, res) => {
    const { hardware_type_id } = req.params || {}

    try {

        const sqlType = 'SELECT * FROM hardware_types where id=?'
        const [typeRows] = await db.query(sqlType, [hardware_type_id])
        if (typeRows.length === 0) {
            return response(res, 404, [], 'Hardware ID not found')
        }

        const sql = 'SELECT * FROM hardware_assets WHERE hardware_type_id=?'
        const [result] = await db.query(sql, hardware_type_id)
        if (result.length === 0) {
            return response(res, 200, [], 'Empty Table')
        }

        return response(res, 200, result, `${typeRows[0].name} Lists`)

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

HardwareRouter.post('/api/hardware', async (req, res) => {
    const { hardware_type_id, serial_number, current_location_id, status } = req.body

    try {
        const sql = `
        INSERT INTO hardware_assets 
            (hardware_type_id, serial_number, current_location_id, status) 
        VALUES
            (?, ?, ?, ?)
        `

        if (!hardware_type_id || !serial_number || !current_location_id || !status) {
            return response(res, 400, null, 'Data cannot be empty')
        }

        const [result] = await db.query(sql, [hardware_type_id, serial_number, current_location_id, status])
        return response(res, 201, result, 'Add new hardware')

    } catch (error) {
        return result(res, 500, null, `${error}`)
    }

})

/**
 * Hardware Report Status
 */



module.exports = HardwareRouter