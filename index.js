// 後端 Node.js 代碼 (app.js)
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
// 創建Express應用
const app = express();
const PORT = process.env.PORT || 3000;
console.log(process.env.MONGODB_URI);
// 連接MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('已連接到MongoDB'))
    .catch((err) => console.error('MongoDB連接錯誤:', err));

// 定義加班記錄的模型
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});
const User = mongoose.model('User', userSchema)
const overtimeEntrySchema = new mongoose.Schema({
    date: String,
    startTime: String,
    endTime: String,
    overtimeHours: Number,
    overtimePay: Number,
});
const overtimeRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    year: Number,
    month: Number,
    data: [overtimeEntrySchema],
    salarySnapshot: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const OvertimeRecord = mongoose.model('OvertimeRecord', overtimeRecordSchema);

// 中間件

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API路由


app.get('/api/user', async (req, res) => {
    try {
        const { id } = req.query
        const user = await User.findById(id)
        res.json(user)
    } catch (error) {
        console.error('查詢錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
})

app.post('/api/user', async (req, res) => {
    try {
        const { username, password, } = req.body;
        const newUser = new User({
            username,
            password,
        })
        await newUser.save()
        res.json(newUser)
    } catch (error) {
        console.error('保存錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });

    }
})

// 獲取特定年月的加班記錄
app.get('/api/overtime', async (req, res) => {
    try {
        const { userId, year, month } = req.query;
        const record = await OvertimeRecord.findOne({
            userId,
            year: parseInt(year),
            month: parseInt(month),
        });
        if (record) {
            res.json(record);
        } else {
            // 如果找不到記錄，返回空數組
            res.json({});
        }
    } catch (error) {
        console.error('查詢錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

// 保存加班記錄
app.post('/api/overtime', async (req, res) => {
    try {
        const { userId, year, month, data, salary } = req.body;
        // 查找現有記錄
        let record = await OvertimeRecord.findOne({
            userId,
            year: parseInt(year),
            month: parseInt(month),
        });

        if (record) {
            // 更新現有記錄
            record.data = data;
            record.updatedAt = new Date();
            record.salary = salary
            await record.save();
        } else {
            // 創建新記錄
            record = new OvertimeRecord({
                year: parseInt(year),
                month: parseInt(month),
                data: data,
                salary: salary
            });
            await record.save();
        }

        res.json({ success: true, message: '數據保存成功' });
    } catch (error) {
        console.error('保存錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

// 設置路由以提供HTML頁面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動服務器
app.listen(PORT, () => {
    console.log(`服務器運行在 http://localhost:${PORT}`);
});
