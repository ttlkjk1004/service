const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Endpoints

// Search Hospitals
app.get('/api/hospitals', (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.json([]);
    }
    db.all(`SELECT * FROM hospitals WHERE name LIKE ?`, [`%${query}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
