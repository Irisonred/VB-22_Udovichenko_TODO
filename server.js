const express = require("express");
const app = express();
const PORT = 3000;
app.use(express.json());
let tasks = [];

app.get("/task", (req, res) => {
    res.json(tasks);
})
app.get("/", (req, res) => {
    res.send("ToDo backend is work!");
})

app.post("/task", (req, res) => {
    tasks.push(req.body);

    res.json({
        status: "ok",
        tasks: tasks
    })
})

app.patch("/task/:id", (req, res) => {
    const id = Number(req.params.id);
    const task = tasks.find((task) => task.id === id);
    if (!task) {
        return res.status(404).json({error: "Задача не найдена"})
    }

    if (req.body.text !== undefined) {
        task.text = req.body.text
    }
    if (req.body.completed !== undefined) {
        task.completed = req.body.completed
    }

    ews.json({
        status: "ok",
        massage: "Задача обновлена успешно",
        task
    })
})

app.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
})