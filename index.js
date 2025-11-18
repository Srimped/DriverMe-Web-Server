import { DB } from "./connect";
import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())

//server home
app.get('/', (req, res) => {
  res.status(200)
  res.send('DriverMe-Server is online')
})


//User API
//GET
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
//POST
// app.post('/api/user', (req, res) => {

// })
//PUT
app.put('/api/user', (req, res) => {
    // Set the response content type to JSON
    res.set('content-type', 'application/json');

    // Extract user data, including the necessary 'id' for the WHERE clause, from the request body
    // Based on the 'users' table schema, we can update these fields: full_name, phone, avatar_url, is_active, is_verified, rating, total_trips
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

    // A complete update statement targeting the user by their ID
    // We update the updated_at column to reflect the change
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

    // The parameters array for the SQL statement (order matters!)
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

    try {
        // Use DB.run() for operations that modify the database (UPDATE, INSERT, DELETE)
        DB.run(SQL, params, err => {
            if (err) {
                console.log(`Database Error on update: ${err.message}`);
                return res.status(500).send(`{"code":500, "status":"Database Error: ${err.message}"}`);
            }

            // 'this.changes' is the number of rows updated
            if (this.changes > 0) {
                // Success: 200 OK
                const content = JSON.stringify({
                    id: id,
                    status: "User data updated successfully",
                    changes: this.changes
                });
                res.status(200).send(content);
            } else {
                // If no rows were changed, the ID likely doesn't exist
                res.status(404).send('{"code":404, "status":"User not found or no change in data"}');
            }
        });
    } catch (err) {
        console.log(`Catch Block Error: ${err.message}`);
        // Use standard 500 Internal Server Error for unexpected errors
        res.status(500).send(`{"code":500, "status":"Server Error: ${err.message}"}`);
    }
});
//DELETE
app.delete('/api/user', (req, res) => {
 res.set('content-type', 'application/json')
  const SQL = 'DELETE FROM users WHERE id=?'

  try{
    DB.run(SQL, [req.query.id], (err) => {
      if(err) {
        throw err
      }
      if (this.changes === 1) {
        res.status(200)
        res.send(`{"message": "User ${req.query.id} was removed from list"}`)
      }
      else {
        res.status(200)
        res.send(`{"message": "No operation needed"}`)
      }
    })
  }catch(err){
    console.log(err.message)
    res.status(468)
    res.send(`{"code":468, "status":"${err.message}"}`)
  }
})




app.listen(5000, err => {
  if(err) {
    console.log('ERROR: ', err.message)
  }

  console.log(`Server is running at port 5000`)
})