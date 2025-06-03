const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const gradeRouter = require('./routes/grade');
const specialityRouter = require('./routes/speciality');
const promotionRouter = require('./routes/promotion');
const seanceTypeCoefficientRouter = require('./routes/seanceTypeCoefficient');
const absenceRouter = require('./routes/absence');
const holidayRouter = require('./routes/holiday'); 
const teacherRouter = require('./routes/teacher');
const scheduleRouter = require('./routes/scheduleSeanceSessions');
const heureSupRouter = require('./routes/heureSup');
const salaryRouter = require('./routes/salary');
const externalSeanceRouter = require('./routes/externalSeance');

app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  credentials: true, // allow credentials
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/auth', authRouter);
app.use('/api/grade', gradeRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/speciality', specialityRouter);
app.use('/api/promotion', promotionRouter);
app.use('/api/seanceTypeCoefficient', seanceTypeCoefficientRouter);
app.use('/api/absence', absenceRouter)
app.use('/api/holiday', holidayRouter);
app.use('/api/heureSup', heureSupRouter);
app.use('/api/salary', salaryRouter);
app.use('/api/external-seance', externalSeanceRouter);

// Special route to manage grade sessions
app.get('/grade-sessions', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'grade-sessions.html'));
});

app.use((req, res, next) => {
    res.status(404).send({ error: 'Route not found' });
});

module.exports = app;
