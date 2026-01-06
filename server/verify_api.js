const http = require('http');

function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.error('Failed to parse response:', body);
                    reject(e);
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAPI() {
    console.log('Starting API Verification...');

    try {
        // 1. List Hospitals
        console.log('\n[1] Testing GET /api/hospitals...');
        let hospitals = await request('GET', '/api/hospitals');
        console.log(`Initial hospital count: ${hospitals.length}`);

        // 2. Create Hospital
        console.log('\n[2] Testing POST /api/hospitals...');
        const newHospital = {
            name: 'Test Hospital',
            location: 'Seoul',
            products: 'Luna',
            system: 'Lap',
            installation_date: '2025-01-01',
            device_type: 'Type A',
            serial_number: '12345',
            revision_firmware: '1.0',
            software_version: '1.0'
        };
        const createdHospital = await request('POST', '/api/hospitals', newHospital);
        console.log('Created:', createdHospital);
        if (!createdHospital.id) throw new Error('Failed to create hospital');

        // 3. Verify Creation
        console.log('\n[3] Verifying Creation...');
        hospitals = await request('GET', '/api/hospitals');
        const found = hospitals.find(h => h.id === createdHospital.id);
        console.log('Found created hospital:', !!found);
        if (!found) throw new Error('Created hospital not found in list');

        // 4. Update Hospital
        console.log('\n[4] Testing PUT /api/hospitals/:id...');
        const updateData = { ...newHospital, name: 'Updated Test Hospital', location: 'Busan' };
        const updateRes = await request('PUT', `/api/hospitals/${createdHospital.id}`, updateData);
        console.log('Update response:', updateRes);

        // 5. Verify Update
        console.log('\n[5] Verifying Update...');
        hospitals = await request('GET', '/api/hospitals');
        const updated = hospitals.find(h => h.id === createdHospital.id);
        console.log('Updated Name:', updated.name);
        if (updated.name !== 'Updated Test Hospital') throw new Error('Update failed');

        // 6. Delete Hospital
        console.log('\n[6] Testing DELETE /api/hospitals/:id...');
        const deleteRes = await request('DELETE', `/api/hospitals/${createdHospital.id}`);
        console.log('Delete response:', deleteRes);

        // 7. Verify Deletion
        console.log('\n[7] Verifying Deletion...');
        hospitals = await request('GET', '/api/hospitals');
        const deleted = hospitals.find(h => h.id === createdHospital.id);
        console.log('Hospital still exists:', !!deleted);
        if (deleted) throw new Error('Deletion failed');

        console.log('\nAll tests passed successfully!');
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

testAPI();
