require('dotenv').config();
const express = require('express');
const cors = require('cors');
const carrierRoutes = require('./routes/carrier');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const alertsRoutes = require('./routes/alerts');
const reportsRoutes = require('./routes/reports');
const organizationRoutes = require('./routes/organization');
const billingRoutes = require('./routes/billing');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/carrier', carrierRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/billing', billingRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CarrierGuard AI Backend running on port ${PORT}`);
});
