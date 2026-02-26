const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/", (req, res) => {
  const { filter, page, limit } = req.query;
  
  let query = "SELECT * FROM tasks";
  
  if (filter === "active") {
    query += " WHERE completed = 0";
  } else if (filter === "completed") {
    query += " WHERE completed = 1";
  }
  
  query += " ORDER BY id DESC";
  
  if (page && limit) {
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
  }
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const tasks = rows.map(task => ({
      ...task,
      completed: task.completed === 1
    }));
    res.json(tasks);
  });
});

router.post("/", (req, res) => {
  const { text, completed } = req.body;
  const completedValue = completed ? 1 : 0;
  const query = `INSERT INTO tasks (text, completed) VALUES ('${text}', ${completedValue})`;
  
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

router.patch("/tasks/:id", (req, res) => {
  const id = req.params.id;
  const { text, completed } = req.body;
  
  let updates = [];
  if (text !== undefined) updates.push(`text = '${text}'`);
  if (completed !== undefined) {
    const val = completed ? 1 : 0;
    updates.push(`completed = ${val}`);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: "Нет данных для обновления" });
  }
  
  const query = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ${id}`;
  
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

router.delete("/tasks/:id", (req, res) => {
  const id = req.params.id;
  const query = `DELETE FROM tasks WHERE id = ${id}`;
  
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

router.delete("/tasks/completed", (req, res) => {
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

module.exports = router;