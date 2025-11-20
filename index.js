import { DB } from "./connect";
import express from 'express'
import cors from 'cors'

const app = express()

app
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(cors())

//server home
app.get('/', (req, res) => {
  res.status(200)
  res.send('DriverMe-Server is online')
})


//User API
//GET all user
app.get('/api/user', (req, res) => {
    res.set('content-type', 'application/json');

    const SQL = 'SELECT id, email, full_name, role, is_active FROM users';
    
    let data = { users: [] };

    DB.all(SQL, [], (err, rows) => {
        if (err) {
            console.error(`Database Error: ${err.message}`);
            return res.status(500).send(JSON.stringify({ 
                code: 500, 
                status: `Database error during query: ${err.message}` 
            }));
        }

        for (const rec of rows) {
            data.users.push({
                id: rec.id,
                email: rec.email,
                name: rec.full_name,
                role: rec.role,
                active: rec.is_active
            });
        }

        let content = JSON.stringify(data);
        res.send(content);
    });
});

//GET selected user by id
app.get('/api/user/:id', (req, res) => {
    res.set('content-type', 'application/json');
    
    const userId = req.params.id;

    const SQL = 'SELECT * FROM users WHERE id = ?';
    
    const params = [userId];

    DB.get(SQL, params, (err, row) => {
        if (err) {
            console.error(`Database Error: ${err.message}`);
            // 500 Internal Server Error for database issues
            return res.status(500).send(JSON.stringify({ 
                code: 500, 
                status: `Database error during query: ${err.message}` 
            }));
        }

        if (!row) {
            // 404 Not Found if no user with that ID exists
            return res.status(404).send(JSON.stringify({
                code: 404,
                status: `User with id ${userId} not found`
            }));
        }

        // 4. Format the result and send the successful response (200 OK)
        let data = { 
            user: {
                id: row.id,
                email: row.email,
                password: row.password,
                name: row.full_name,
                phone: row.phone,
                avatar: row.avatar_url,
                role: row.role,
                active: row.is_active,
                verified: row.is_verified,
                rating: row.rating,
                total: row.total,
            }
        };

        let content = JSON.stringify(data);
        res.status(200).send(content);
    });
});


//POST
// app.post('/api/user', (req, res) => {

// })
//PUT
app.put('/api/user/:id', (req, res) => {
    res.set('content-type', 'application/json');

    const {
        id,
        email,
        full_name,
        phone,
        avatar_url,
        is_active,
        is_verified,
        rating,
        total_trips
    } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Missing ID in request body" });
    }

    const SQL = `
        UPDATE users
        SET email = ?,
            full_name = ?,
            phone = ?,
            avatar_url = ?,
            is_active = ?,
            is_verified = ?,
            rating = ?,
            total_trips = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
    `;

    const params = [
        email,
        full_name,
        phone,
        avatar_url,
        is_active,
        is_verified,
        rating,
        total_trips,
        id
    ];

    DB.run(SQL, params, function (err) {
        if (err) {
            console.log("DB ERROR:", err);
            return res.status(500).json({ message: err.message });
        }

        if (this.changes > 0) {
            return res.status(200).json({
                id,
                message: "User data updated successfully"
            });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    });
});


//DELETE
app.delete('/api/user/:id', (req, res) => {
    const userId = req.params.id;

    const SQL = `
        DELETE FROM users
        WHERE id = ?
    `;

    DB.run(SQL, [userId], function (err) {
        if (err) {
            console.log("DB ERROR:", err.message);
            return res.status(500).json({ message: "Database error: " + err.message });
        }

        if (this.changes > 0) {
            return res.status(200).json({ 
                message: "User deleted successfully", 
                deletedId: userId 
            });
        }

        return res.status(404).json({ message: "User not found" });
    });
});






//Driver API
//GET all driver
app.get('/api/driver', (req, res) => {
    res.set('content-type', 'application/json');

    const SQL = 'SELECT id, license_number, vehicle_type, vehicle_brand, vehicle_model, license_plate FROM driver_profiles';
    
    let data = { drivers: [] };

    DB.all(SQL, [], (err, rows) => {
        if (err) {
            console.error(`Database Error: ${err.message}`);
            return res.status(500).send(JSON.stringify({ 
                code: 500, 
                status: `Database error during query: ${err.message}` 
            }));
        }

        for (const rec of rows) {
            data.drivers.push({
                id: rec.id,
                licenseNo: rec.license_number,
                licensePlate: rec.license_plate,
                type: rec.vehicle_type,
                brand: rec.vehicle_brand,
                model: rec.vehicle_model,
            });
        }

        let content = JSON.stringify(data);
        res.send(content);
    });
});

//GET selected driver by id
app.get('/api/driver/:id', (req, res) => {
    res.set('content-type', 'application/json');

    const driverId = req.params.id;

    const SQL = `
        SELECT 
            driver_profiles.*,
            users.id AS user_id,
            users.full_name,
            users.email,
            users.phone
        FROM driver_profiles
        JOIN users ON driver_profiles.user_id = users.id
        WHERE driver_profiles.id = ?;
    `;

    const params = [driverId];

    DB.get(SQL, params, (err, row) => {
        if (err) {
            console.error(`Database Error: ${err.message}`);
            return res.status(500).send(JSON.stringify({
                code: 500,
                status: `Database error during query: ${err.message}`
            }));
        }

        if (!row) {
            return res.status(404).send(JSON.stringify({
                code: 404,
                status: `Driver with id ${driverId} not found`
            }));
        }

        let data = {
            driver: {
                id: row.id,
                licenseNo: row.license_number,
                licenseImg: row.license_image,
                type: row.vehicle_type,
                brand: row.vehicle_brand,
                model: row.vehicle_model,
                year: row.vehicle_year,
                licensePlate: row.license_plate,
                available: row.is_available,
                latitude: row.current_latitude,
                longitude: row.current_longitude,
                document: row.document_verified,
            },
            user: {
                id: row.user_id,
                name: row.full_name,
                email: row.email,
                phone: row.phone,
            }
        };

        res.status(200).send(JSON.stringify(data));
    });
});


//PUT edit driver
app.put('/api/driver/:id', (req, res) => {
    res.set('content-type', 'application/json');

    const {
        id,
        licenseNo,
        licensePlate,
        model,
        brand,
        type,
        year,
    } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Missing ID in request body" });
    }

    const SQL = `
        UPDATE driver_profiles
        SET license_number = ?,
            license_plate = ?,
            vehicle_model = ?,
            vehicle_brand = ?,
            vehicle_type = ?,
            vehicle_year = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;

    `;

    const params = [
        licenseNo,
        licensePlate,
        model,
        brand,
        type,
        year,
        id
    ];

    DB.run(SQL, params, function (err) {
        if (err) {
            console.log("DB ERROR:", err);
            return res.status(500).json({ message: err.message });
        }

        if (this.changes > 0) {
            return res.status(200).json({
                id,
                message: "Driver data updated successfully"
            });
        } else {
            return res.status(404).json({ message: "Driver not found" });
        }
    });
});


//DELETE driver info
app.delete('/api/driver/:id', (req, res) => {
    const driverId = req.params.id;

    const SQL = `
        DELETE FROM driver_profiles
        WHERE id = ?
    `;

    DB.run(SQL, [driverId], function (err) {
        if (err) {
            console.log("DB ERROR:", err.message);
            return res.status(500).json({ message: "Database error: " + err.message });
        }

        if (this.changes > 0) {
            return res.status(200).json({ 
                message: "Driver deleted successfully", 
                deletedId: driverId 
            });
        }

        return res.status(404).json({ message: "Driver not found" });
    });
});






//App setting
//GET all setting
app.get('/api/app', (req, res) => {
    res.set('content-type', 'application/json');

    const SQL = 'SELECT id, setting_key, setting_value, description FROM app_settings';
    
    let data = { settings: [] };

    DB.all(SQL, [], (err, rows) => {
        if (err) {
            console.error(`Database Error: ${err.message}`);
            return res.status(500).send(JSON.stringify({ 
                code: 500, 
                status: `Database error during query: ${err.message}` 
            }));
        }

        for (const rec of rows) {
            data.settings.push({
                id: rec.id,
                key: rec.setting_key,
                value: rec.setting_value,
                des: rec.description
            });
        }

        let content = JSON.stringify(data);
        res.send(content);
    });
});

//GET selected setting
app.get('/api/app/:id', (req, res) => {
    res.set('content-type', 'application/json');
    
    const settingId = req.params.id;

    const SQL = 'SELECT * FROM app_settings WHERE id = ?';
    
    const params = [settingId];

    DB.get(SQL, params, (err, row) => {
        if (err) {
            console.error(`Database Error: ${err.message}`);
            // 500 Internal Server Error for database issues
            return res.status(500).send(JSON.stringify({ 
                code: 500, 
                status: `Database error during query: ${err.message}` 
            }));
        }

        if (!row) {
            // 404 Not Found if no setting with that ID exists
            return res.status(404).send(JSON.stringify({
                code: 404,
                status: `Setting with id ${settingIdId} not found`
            }));
        }

        // 4. Format the result and send the successful response (200 OK)
        let data = { 
            setting: {
                id: row.id,
                key: row.setting_key,
                value: row.setting_value,
                des: row.description,
            }
        };

        let content = JSON.stringify(data);
        res.status(200).send(content);
    });
});


//PUT edit setting
app.put('/api/app/:id', (req, res) => {
    res.set('content-type', 'application/json');

    const {
        id,
        key,
        value,
        des
    } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Missing ID in request body" });
    }

    const SQL = `
    UPDATE app_settings
    SET setting_key = ?,
        setting_value = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?;
    `;

    const params = [
        key,
        value,
        des,
        id
    ];

    DB.run(SQL, params, function (err) {
        if (err) {
            console.log("DB ERROR:", err);
            return res.status(500).json({ message: err.message });
        }

        if (this.changes > 0) {
            return res.status(200).json({
                id,
                message: "Setting updated successfully"
            });
        } else {
            return res.status(404).json({ message: "Setting not found" });
        }
    });
});

//DELETE setting
app.delete('/api/app/:id', (req, res) => {
    const settingId = req.params.id;

    const SQL = `
        DELETE FROM app_settings
        WHERE id = ?
    `;

    DB.run(SQL, [settingId], function (err) {
        if (err) {
            console.log("DB ERROR:", err.message);
            return res.status(500).json({ message: "Database error: " + err.message });
        }

        if (this.changes > 0) {
            return res.status(200).json({ 
                message: "Setting deleted successfully", 
                deletedId: settingId
            });
        }

        return res.status(404).json({ message: "Setting not found" });
    });
});




app.listen(5000, err => {
  if(err) {
    console.log('ERROR: ', err.message)
  }

  console.log(`Server is running at port 5000`)
})