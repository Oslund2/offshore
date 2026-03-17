const express = require('express');
const cors = require('cors');
const { getDb } = require('./database');
const buRoutes = require('./routes/businessUnits');
const roleRoutes = require('./routes/roles');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
getDb();

// Routes
app.use('/api/business-units', buRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`GWOE Server running on port ${PORT}`);
});
