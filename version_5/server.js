const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const port = 3000;

// MySQL 연결 설정
const db = mysql.createConnection({
    host: '220.69.240.35',
    port: '3306',
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
    const values = rows.map(row => [row.name, row.fridge, row.freeze, row.date]);

    const sql = 'INSERT INTO ingredient (name,fridge,freeze,expirationDate) VALUES ?';
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

app.get('/ingredients', (req, res) => {
    const sql = `SELECT name, fridge, freeze, expirationDate, purchaseDate
                 FROM ingredient`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        } else {
            const today = new Date().toISOString().split('T')[0];
            const data = {
                fridge: [],
                freeze: [],
                todayFridge: [],
                todayFreeze: []
            };

            results.forEach(item => {
                const purchaseDateAdjusted = new Date(item.purchaseDate);
                purchaseDateAdjusted.setDate(purchaseDateAdjusted.getDate() + 1); // 하루 추가

                const isToday = purchaseDateAdjusted.toISOString().split('T')[0] === today;
                if (item.fridge === 1) {
                    isToday ? data.todayFridge.push(item) : data.fridge.push(item);
                } else if (item.freeze === 1) {
                    isToday ? data.todayFreeze.push(item) : data.freeze.push(item);
                }
            });
            res.json(data);
            console.log(data);
        }
    });
});

app.listen(port, () => {
    console.log('Server is running...');
    console.log(`Server running at http://localhost:${port}`);
});