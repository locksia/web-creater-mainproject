const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const port = 3000;
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Fetch를 위한 패키지

// OpenAI API 키와 엔드포인트
const apiKey = "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";
const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, '영수증' + path.extname(file.originalname)); // 저장 이름을 'uploaded_image'로 고정
    }
});
const upload = multer({ storage: storage });

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
    const values = rows.map(row => [row.name, row.fridge, row.freeze, row.date, row.type]);

    const sql = 'INSERT INTO ingredient (name,fridge,freeze,expirationDate,image_id) VALUES ?';
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
    const sql = `SELECT i.id, i.name, i.fridge, i.freeze, i.expirationDate, i.purchaseDate, i.uses, im.Data
                 FROM ingredient i
                 LEFT JOIN images im ON i.image_id = im.id`;
    db.query(sql, async (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        } else {
            const today = new Date().toISOString().split('T')[0];
            const data = {
                fridge: [],
                freeze: [],
                todayFridge: [],
                todayFreeze: [],
            };

            results.forEach(item => {
                const purchaseDateAdjusted = new Date(item.purchaseDate);
                purchaseDateAdjusted.setDate(purchaseDateAdjusted.getDate() + 1); // 하루 추가
                const isToday = purchaseDateAdjusted.toISOString().split('T')[0] === today;
                
                //혹시 오늘 식재료 인식이 잘 안된다면 밑에껄로 바꿔서 해볼 것
                //const purchaseDate = new Date(item.purchaseDate);
                //const purchaseDateOnly = purchaseDate.toISOString().split('T')[0]; // 시간 제거
                //const isToday = purchaseDateOnly === today;

                const imageBase64 = item.Data
                    ? `data:image/png;base64,${item.Data.toString('base64')}`
                    : null;
                
                    item.Data = imageBase64;
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

app.get('/receipts', async (req, res) => {
    const sql = `SELECT name FROM ingredient`;
    db.query(sql, async (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        } else {
            const data = {
                ingredients: []
            };

            results.forEach(item => {
                data.ingredients.push(item.name);    
            });

            data.ingredients = await fetchAIResponse(data.ingredients,1);

            res.json(data);
            console.log(data);
        }
    });
});

app.get('/getIngredients', (req, res) => {
    const query = 'SELECT name, remainingDays FROM ingredient WHERE remainingDays <= 3';
    db.query(query, (err, result) => {
        if (err) {
            res.status(500).send({ error: 'Database query error' });
            return;
        }
        console.log(result);
        res.json(result); // 클라이언트에 데이터 전송
    });
});


app.post('/ingredients/halfUse', (req,res) => {
    const { id } = req.body; // 요청으로 전달된 항목 ID
    try {
        console.log('사용 횟수 증가',[id])
        // 데이터베이스에서 해당 항목의 'uses' 증가
        db.query('UPDATE ingredient SET uses = uses + 1 WHERE id = ?', [id]);
        res.status(200).send({ success: true, message: 'Uses count updated' });
    } catch (error) {
        console.error('Error updating uses count:', error);
        res.status(500).send({ success: false, message: 'Error updating uses count' });
    }
})

app.post('/ingredients/fullUse', (req,res) => {
    const { id } = req.body; // 요청으로 전달된 항목 ID
    try {
        console.log('모두 사용 후 삭제',[id])
        // 데이터베이스에서 해당 항목의 'uses' 증가
        db.query('DELETE FROM ingredient WHERE id = ?', [id]);
        res.status(200).send({ success: true, message: 'Uses count updated' });
    } catch (error) {
        console.error('Error updating uses count:', error);
        res.status(500).send({ success: false, message: 'Error updating uses count' });
    }
})

async function fetchAIResponse(prompt,number) {
    const a = `다음 텍스트에서 상품명과 냉동식품과 냉장식품을 구별하여 한 줄씩 정리해줘,가격은 필요 없어(예를 들어 아이스크림 1개가 텍스트에 있으면 냉동:아이스크림-1개):\n${prompt}`;
    //const b = `${prompt}들을 재료로 써서 만들 수 요리와 레시피들을 3개씩 정리해줘(예를 들어 1.요리이름 2.레시피 첫째줄 3. 레시피 둘째줄 1.다른요리이름 2.다른요리 레시피 첫쨰줄):`;
    const b = `${prompt}들을 재료로 써서 만들 수 요리이름 5개 정리해줘(요리이름 하나당 10글자 이상 20글자가 이하 정도로 해주고 글자수는 표시하지 말아줘))`;
    if(number == 1){
        const requestOptions1 = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: b
                }],
                temperature: 0,
                max_tokens: 500
            }),
        };
        try {
            const response = await fetch(apiEndpoint, requestOptions1);
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API 호출 중 오류 발생:', error);
            return 'OpenAI API 호출 중 오류 발생';
        }
    }else{
        const requestOptions2 = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: a
                }],
                temperature: 0,
                max_tokens: 500
            }),
        };
        try {
            const response = await fetch(apiEndpoint, requestOptions2);
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API 호출 중 오류 발생:', error);
            return 'OpenAI API 호출 중 오류 발생';
        }
    }
};

// 파일 업로드 후 OCR 및 OpenAI API 호출
app.post('/upload', upload.single('receipt'), (req, res) => {
    if (!req.file) {
        return res.send('파일을 업로드해주세요.');
    }

    const imagePath = path.join(uploadDir, req.file.filename);

    // OCR로 텍스트 추출
    Tesseract.recognize(imagePath, 'kor', {
        logger: info => console.log(info)
    })
    .then(({ data: { text } }) => {
        console.log('OCR 추출 결과:', text);

        // OpenAI API 호출로 상품명과 수량 정리
        return fetchAIResponse(text,2);
    })
    .then(aiResponse => {
        console.log('OpenAI 응답:', aiResponse);

        // GPT 결과를 텍스트 파일로 저장
        const resultFilePath = path.join(uploadDir, `재료목록.txt`);
        fs.writeFileSync(resultFilePath, aiResponse, 'utf8');
        console.log(`결과가 텍스트 파일로 저장되었습니다: ${resultFilePath}`);

        // 사용자에게 결과 출력
        res.send(`
            <h2>처리가 완료되었습니다.</h2>
            <p>결과가 서버에 저장되었습니다: ${resultFilePath}</p>
        `);
    })
    .catch(error => {
        console.error('처리 중 오류 발생:', error);
        res.send('처리 중 오류가 발생했습니다.');
    });
});

app.listen(port, () => {
    console.log('Server is running...');
    console.log(`Server running at http://localhost:${port}`);
});