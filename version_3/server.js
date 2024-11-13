const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const port = 3000;

// MySQL 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test',
    charset: 'utf8mb4'
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err); 
        return;
    }
    console.log('MySQL Connected...');
});

app.use(cors());
app.use(bodyParser.json());

// 데이터 삽입 API
app.post('/submit', (req, res) => {
    const rows = req.body.rows;
    const values = rows.map(row => [row.name, row.inside, row.outside, row.date]);

    const sql = 'INSERT INTO ingredient (name,inside,outside,date) VALUES ?';
    db.query(sql, [values], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        } else {
            console.log('등록된 식재료' + values);
            res.json({ message: '식재료 등록이 완료되었습니다.' });
        }
    });
});

app.listen(port, () => {
    console.log('Server is running...');
    console.log(`Server running at http://localhost:${port}`);
});