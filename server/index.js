const express = require('express');
const cors = require('cors');
const db = require('./database');
const { importHospitals } = require('./import_data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Endpoints

// Search or List Hospitals
app.get('/api/hospitals', (req, res) => {
    const { query } = req.query;
    if (!query) {
        db.all(`SELECT * FROM hospitals ORDER BY name`, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
        return;
    }
    db.all(`SELECT * FROM hospitals WHERE name LIKE ? ORDER BY name`, [`%${query}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Add Hospital
app.post('/api/hospitals', (req, res) => {
    console.log('POST /api/hospitals received:', req.body);
    const {
        name, location, products, system, installation_date,
        device_type, serial_number, revision_firmware, software_version
    } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Hospital name is required' });
    }
    const sql = `INSERT INTO hospitals (
        name, location, products, system, installation_date, 
        device_type, serial_number, revision_firmware, software_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
        name, location, products, system, installation_date,
        device_type, serial_number, revision_firmware, software_version
    ], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            id: this.lastID, name, location, products, system, installation_date,
            device_type, serial_number, revision_firmware, software_version
        });
    });
});

// Update Hospital
app.put('/api/hospitals/:id', (req, res) => {
    const { id } = req.params;
    const {
        name, location, products, system, installation_date,
        device_type, serial_number, revision_firmware, software_version
    } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Hospital name is required' });
    }
    const sql = `UPDATE hospitals SET 
        name = ?, location = ?, products = ?, system = ?, installation_date = ?, 
        device_type = ?, serial_number = ?, revision_firmware = ?, software_version = ? 
        WHERE id = ?`;

    db.run(sql, [
        name, location, products, system, installation_date,
        device_type, serial_number, revision_firmware, software_version,
        id
    ], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Hospital not found' });
        }
        res.json({ message: 'Hospital updated successfully' });
    });
});

// Delete Hospital
app.delete('/api/hospitals/:id', (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /api/hospitals/${id} received`);
    db.run('DELETE FROM hospitals WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Hospital not found' });
        }
        res.json({ message: 'Hospital deleted successfully' });
    });
});

// Import/Reset Hospital Data from Excel
app.post('/api/hospitals/reset-and-import', async (req, res) => {
    try {
        const result = await importHospitals(db);
        res.json({ message: 'Data imported successfully', count: result.count });
    } catch (error) {
        console.error('Import failed:', error);
        res.status(500).json({ error: 'Import failed: ' + error.message });
    }
});

// Create Report
app.post('/api/reports', (req, res) => {
    const {
        hospitalId, hospitalName, location, products, system, warranty,
        activityType, deviceDetails, subject, serviceDetails,
        partsDetails, serviceHours, servicerName, customerName, serviceDate,
        servicerSignature, customerSignature
    } = req.body;

    const sql = `INSERT INTO reports (
        hospitalId, hospitalName, location, products, system, warranty, 
        activityType, deviceDetails, subject, serviceDetails, 
        partsDetails, serviceHours, servicerName, customerName, serviceDate,
        servicerSignature, customerSignature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        hospitalId, hospitalName, location, products, system, warranty,
        JSON.stringify(activityType), JSON.stringify(deviceDetails), subject, serviceDetails,
        JSON.stringify(partsDetails), JSON.stringify(serviceHours), servicerName, customerName, serviceDate,
        servicerSignature, customerSignature
    ];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

// List Reports with Search
app.get('/api/reports', (req, res) => {
    const { date, customer, products } = req.query;
    let sql = 'SELECT * FROM reports';
    const params = [];
    const conditions = [];

    console.log('GET /api/reports params:', { date, customer, products });

    if (date) {
        conditions.push('serviceDate = ?');
        params.push(date);
    }
    if (customer) {
        conditions.push('hospitalName LIKE ?');
        params.push(`%${customer}%`);
    }
    if (products) {
        conditions.push('products LIKE ?');
        params.push(`%${products}%`);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';
    console.log('SQL:', sql, params);

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`Found ${rows.length} rows`);
        res.json(rows);
    });
});

// Get Single Report
app.get('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(row);
    });
});

// Update Report
app.put('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const {
        hospitalId, hospitalName, location, products, system, warranty,
        activityType, deviceDetails, subject, serviceDetails,
        partsDetails, serviceHours, servicerName, customerName, serviceDate,
        servicerSignature, customerSignature
    } = req.body;

    const sql = `UPDATE reports SET
        hospitalId = ?, hospitalName = ?, location = ?, products = ?, system = ?, warranty = ?,
        activityType = ?, deviceDetails = ?, subject = ?, serviceDetails = ?,
        partsDetails = ?, serviceHours = ?, servicerName = ?, customerName = ?, serviceDate = ?,
        servicerSignature = ?, customerSignature = ?
        WHERE id = ?`;

    const params = [
        hospitalId, hospitalName, location, products, system, warranty,
        JSON.stringify(activityType), JSON.stringify(deviceDetails), subject, serviceDetails,
        JSON.stringify(partsDetails), JSON.stringify(serviceHours), servicerName, customerName, serviceDate,
        servicerSignature, customerSignature,
        id
    ];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Report updated successfully' });
    });
});

// Delete Report
app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM reports WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Report deleted successfully' });
    });
});

const path = require('path');

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
