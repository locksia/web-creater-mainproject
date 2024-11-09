const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// MySQL 연결 설정
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err); 
        return;
    }
    console.log('MySQL Connected...');
});

app.use(bodyParser.json());

// 데이터 삽입 API
app.post('/submit', (req, res) => {
    const rows = req.body.rows;
    const values = rows.map(text => [text]);

    const sql = 'INSERT INTO your_table (column_name) VALUES ?';
    db.query(sql, [values], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        } else {
            res.json({ message: 'Data inserted successfully' });
        }
    });
});

app.listen(port, () => {
    console.log('Server is running...');
    console.log(`Server running at http://localhost:${port}`);
});
