const express = require('express')
const response = require('../Response/response')
const db = require('../Database/conn')

const ReportRoutes = express.Router()

/**
 * Report Category
 */
ReportRoutes.get('/api/report-categories', async (req, res) => {
    const sql = 'SELECT * FROM report_categories'

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

ReportRoutes.post('/api/report-categories', async (req, res) => {
    const { name, description } = req.body || {};
    try {
        const sql = 'INSERT INTO report_categories (name, description) VALUES (?, ?)'

        if (!name) {
            return response(res, 400, null, "Category name cannot be null")
        }

        const [result] = await db.query(sql, [name, description])

        return response(res, 201, result, `Add new category report`)

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

/**
 * Report Check Parameter
 */

ReportRoutes.get('/api/report-parameter/:hardware_type_id', async (req, res) => {
    const { hardware_type_id } = req.params
    const sql = "SELECT * FROM check_parameters WHERE hardware_type_id = ?"

    try {

        const [result] = await db.query(sql, [hardware_type_id])
        if (result.length === 0) {
            return response(res, 200, [], `Empty Table`)
        }

        return response(res, 200, result, `Check Parameter`)

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

ReportRoutes.post('/api/report-parameter/', async (req, res) => {
    const { hardware_type_id, parameter_name, is_active = true } = req.body || {}

    try {

        if (!hardware_type_id || !parameter_name) {
            return response(res, 400, null, 'Data cannot be null')
        }

        const [hardwareTypeRows] = await db.query('SELECT * FROM hardware_types WHERE id = ?', [hardware_type_id])
        if (hardwareTypeRows.length === 0) {
            return response(res, 400, null, 'Hardware ID is not exist')
        }

        const sql = `INSERT INTO check_parameters (hardware_type_id, parameter_name, is_active) VALUES (?, ?, ?) `
        const [result] = await db.query(sql, [hardware_type_id, parameter_name, is_active])
        return response(res, 201, result, 'Add new check parameter')

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

/**
 * Hardware Health Report
 */
ReportRoutes.get('/api/health-report', async (req, res) => {
    try {
        const sql = `SELECT * FROM health_reports`
        const [result] = await db.query(sql)
        if (result.length === 0) {
            return response(res, 200, [], "Empty Table")
        }

        return response(res, 200, result, 'Health Reports')

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

ReportRoutes.post('/api/health-report', async (req, res) => {
    const { asset_id, reporter_name, report_data } = req.body

    try {

        if (!asset_id || !reporter_name || !report_data) {
            return response(res, 400, null, 'Data cannot be empty')
        }

        // Check the duplicate incoming reports
        const checkSql = `
        SELECT reporter_name FROM health_reports
        WHERE asset_id = ?
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `;
        const [existingReport] = await db.query(checkSql, [asset_id]);

        if (existingReport.length > 0) {
            return response(res, 400, null, 'A report for this hardware has already been submitted this month.');
        }

        
        // Get the hardware assets data with the install location
        const sqlAsset = `
        SELECT ha.current_location_id, il.hardware_type_id, il.category_id 
        FROM hardware_assets ha
        JOIN install_locations il ON ha.current_location_id = il.id
        WHERE ha.id = ?
        `
        const [assetRows] = await db.query(sqlAsset, [asset_id])

        if (assetRows.length === 0) {
            return response(res, 404, null, 'Asset ID does not exist');
        }

        // Get the actual hardware location, category, and hardware_type
        const actualLocationId = assetRows[0].current_location_id
        const actualCategoryId = assetRows[0].category_id
        const actualHardwareTypeId = assetRows[0].hardware_type_id;
        
        // Get the parameter with the actual hardware_type
        const sqlCheckParams = `SELECT parameter_name FROM check_parameters WHERE hardware_type_id = ? AND is_active = 1`;
        const [paramRows] = await db.query(sqlCheckParams, [actualHardwareTypeId]);

        // Filter the incoming keys to see if any do NOT exist in the database
        const validParameterNames = paramRows.map(row => row.parameter_name);
        const providedParameterNames = Object.keys(report_data);

        const invalidKeys = providedParameterNames.filter(key => !validParameterNames.includes(key));

        if (invalidKeys.length > 0) {
            return response(res, 400, null, `Invalid parameters detected: ${invalidKeys.join(', ')}`);
        }

        // Insert the valid reports
        const sql = `
        INSERT INTO health_reports 
            (category_id, location_id, asset_id, reporter_name, report_data)
        VALUES
            (?, ?, ?, ?, ?)
        `

        const finalReportData = typeof report_data === 'object' ? JSON.stringify(report_data) : report_data;
        const [result] = await db.query(sql, [actualCategoryId, actualLocationId, asset_id, reporter_name, finalReportData]);
        return response(res, 200, result, 'Report submitted successfully');

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

ReportRoutes.get('/api/health-report/:category_id', async (req, res) => {
    const { category_id } = req.params;

    try {

        const sqlCategory = `SELECT * FROM report_categories WHERE id=?`
        const [categoryRow] = await db.query(sqlCategory, [category_id]);

        if (categoryRow.length === 0) {
            return response(res, 404, null, 'Catgegory not exsisted')
        }

        const sql = `
        SELECT * FROM health_reports 
        WHERE category_id=?
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at) = YEAR(CURRENT_DATE());
        `
        const [result] = await db.query(sql, [category_id])

        if (result.length === 0) {
            return response(res, 200, [], 'Empty List')
        }

        return response(res, 200, result, `Reports`)

    } catch (error) {
        return response(res, 500, null, `${error}`)
    }
})

// Hardware Checklist
ReportRoutes.get('/api/report-checklist/:category_id', async (req, res) => {
    const { category_id } = req.params;

    const sql = `
    SELECT 
        il.id AS location_id,
        il.location_name,
        il.hardware_type_id, /* ADDED THIS LINE */
        ha.id AS asset_id,
        ha.serial_number,
        CASE 
            WHEN COUNT(hr.id) > 0 THEN 'Checked'
            ELSE 'Need Checking'
        END AS check_status
    FROM install_locations il
    LEFT JOIN hardware_assets ha ON il.id = ha.current_location_id
    LEFT JOIN health_reports hr ON ha.id = hr.asset_id 
        AND MONTH(hr.created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(hr.created_at) = YEAR(CURRENT_DATE())
    WHERE il.category_id = ?
    GROUP BY il.id, il.location_name, il.hardware_type_id, ha.id, ha.serial_number 
    `;

    try {
        const [result] = await db.query(sql, [category_id]);

        if (result.length > 0) {
            return response(res, 200, result, "Lists Hardware");
        } else {
            return response(res, 200, [], "Empty Table");
        }
    } catch (error) {
        return response(res, 500, null, `${error}`);
    }
});

// Single Hardware Report
ReportRoutes.get('/api/health-report/asset/:asset_id', async (req, res) => {
    const { asset_id } = req.params;

    const sql = `
        SELECT * FROM health_reports 
        WHERE asset_id = ? 
        AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `;

    try {
        const [result] = await db.query(sql, [asset_id]);

        // If a report exists, return the single object (result[0]) instead of an array
        if (result.length > 0) {
            return response(res, 200, result[0], "Asset report retrieved successfully");
        } else {
            return response(res, 404, null, "No report found for this asset in the current month");
        }
    } catch (error) {
        return response(res, 500, null, `${error}`);
    }
})

module.exports = ReportRoutes