const express = require("express");
const router = express.Router();
const db = require("./db");

function escapeSql(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/'/g, "''")
    .replace(/"/g, '\\"')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

router.get("/", (req, res) => {
  const { filter } = req.query;
  
  let query = "SELECT * FROM tasks";
  
  if (filter === "active") {
    query += " WHERE completed = 0";
  } else if (filter === "completed") {
    query += " WHERE completed = 1";
  }
  
  query += " ORDER BY id DESC";
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const tasks = rows.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed === 1
    }));
    
    res.json(tasks);
  });
});

router.post("/", (req, res) => {
  const { text, completed } = req.body;
  const completedValue = completed ? 1 : 0;
  
  const safeText = escapeSql(text);
  
  const query = `INSERT INTO tasks (text, completed) VALUES ('${safeText}', ${completedValue})`;
  
  db.run(query, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      status: "ok",
      message: "Задача добавлена",
      id: this.lastID,
      text: text,
      completed: completed
    });
  });
});

router.patch("/:id", (req, res) => {
  const id = req.params.id;
  const { text, completed } = req.body;
  
  let updates = [];
  
  if (text !== undefined) {
    const safeText = escapeSql(text);
    updates.push(`text = '${safeText}'`);
  }
  
  if (completed !== undefined) {
    const val = completed ? 1 : 0;
    updates.push(`completed = ${val}`);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: "Нет данных для обновления" });
  }
  
  const safeId = escapeSql(id);
  const query = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ${safeId}`;
  
  db.run(query, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Задача не найдена" });
    }
    
    res.json({
      status: "ok",
      message: "Задача обновлена",
      id: Number(id),
      ...req.body
    });
  });
});

router.delete("/completed", (req, res) => {
  const query = `DELETE FROM tasks WHERE completed = 1`;
  
  db.run(query, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      status: "ok",
      message: `Удалено задач: ${this.changes}`,
      deletedCount: this.changes
    });
  });
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;
  
  const safeId = escapeSql(id);
  const query = `DELETE FROM tasks WHERE id = ${safeId}`;
  
  db.run(query, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Задача не найдена" });
    }
    
    res.json({
      status: "ok",
      message: "Задача удалена",
      id: Number(id)
    });
  });
});



module.exports = router;