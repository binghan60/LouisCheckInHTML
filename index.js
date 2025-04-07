// 後端 Node.js 代碼 (app.js)
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

// 創建Express應用
const app = express();
const PORT = process.env.PORT || 3000;

// 連接MongoDB
mongoose.connect('mongodb://localhost:27017/overtime_tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('已連接到MongoDB'))
.catch(err => console.error('MongoDB連接錯誤:', err));

// 定義加班記錄的模型
const overtimeEntrySchema = new mongoose.Schema({
  date: String,
  startTime: String,
  endTime: String,
  overtimeHours: Number,
  overtimePay: Number
});

const overtimeRecordSchema = new mongoose.Schema({
  year: Number,
  month: Number,
  data: [overtimeEntrySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const OvertimeRecord = mongoose.model('OvertimeRecord', overtimeRecordSchema);

// 中間件
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API路由

// 獲取特定年月的加班記錄
app.get('/api/overtime', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const record = await OvertimeRecord.findOne({ 
      year: parseInt(year), 
      month: parseInt(month) 
    });
    
    if (record) {
      res.json(record.data);
    } else {
      // 如果找不到記錄，返回空數組
      res.json([]);
    }
  } catch (error) {
    console.error('查詢錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 保存加班記錄
app.post('/api/overtime', async (req, res) => {
  try {
    const { year, month, data } = req.body;
    
    // 查找現有記錄
    let record = await OvertimeRecord.findOne({ 
      year: parseInt(year), 
      month: parseInt(month) 
    });
    
    if (record) {
      // 更新現有記錄
      record.data = data;
      record.updatedAt = new Date();
      await record.save();
    } else {
      // 創建新記錄
      record = new OvertimeRecord({
        year: parseInt(year),
        month: parseInt(month),
        data: data
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