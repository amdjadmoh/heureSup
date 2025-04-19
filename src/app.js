const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const gradeRouter = require('./routes/grade');
const teacherRouter = require('./routes/teacher');4
const scheduleRouter = require('./routes/scheduleSeanceSessions');
const heureSupRouter = require('./routes/heureSup');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/api/auth', authRouter);
app.use('/api/grade', gradeRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/schedule', scheduleRouter);
// app.use('/api/heureSup', heureSupRouter);

app.use((req, res, next) => {
    res.status(404).send({ error: 'Route not found' });
});

module.exports = app;
