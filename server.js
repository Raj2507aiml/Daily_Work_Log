const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();


app.use(cors()); 
app.use(express.json()); 

app.post('/add', (req, res) => {
  const { task, hours } = req.body;

  if (!task || !hours) {
    return res.status(400).json({ error: 'Task and hours are required' });
  }

  const sql = 'INSERT INTO worklog (task, hours) VALUES (?, ?)';
  db.run(sql, [task, hours], function(err) {
    if (err) {
      console.error('Error inserting log:', err);
      return res.status(500).json({ error: 'Failed to add work log' });
    }
    res.json({ message: 'Work log added successfully', id: this.lastID });
  });
});

app.get('/logs', (req, res) => {
  const sql = 'SELECT * FROM worklog ORDER BY date DESC';
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching logs:', err);
      return res.status(500).json({ error: 'Failed to fetch work logs' });
    }
    res.json(rows);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
