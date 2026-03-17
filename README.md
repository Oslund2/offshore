# GWOE — Global Workforce Optimization Engine

A high-intelligence decision-support tool for business unit leaders to evaluate offshoring potential across departments (Data, News, Business, Dev, Product, and Cyber).

## Architecture

- **Frontend**: React 18 + Tailwind CSS (Bloomberg/FinTech executive-style UI)
- **Backend**: Node.js + Express
- **Database**: SQLite (local) with Supabase integration (cloud)
- **AI Engine**: Rule-based intelligence for auto-rationale, risk assessment, and executive summaries

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start the backend (port 3001)
npm run dev:server

# Start the frontend (port 3000)
npm run dev:client
```

## Features

### Core
- **Multi-Unit Structure**: Toggle between 6 Business Units (Cyber, News, Data, Product, Development, Business)
- **Standard Evaluation Framework**: Track Role Name, Level (L1-L4), Offshore Candidate, Recommendation (Y/N/P), Qualitative Why, FTE count, and Estimated Spend
- **Full CRUD**: Add, edit, delete any role with instant recalculation

### AI Enhancement Layer
- **Auto-Rationale**: AI suggests the "Why" based on role level, type, and industry patterns
- **Risk/Reward Synthesis**: Pro/Con button generates 3-point bulleted risk assessment with mitigation strategies
- **AI Insights**: Automatic "High Quality Loss" warnings when keywords like Security, Local, or Strategic are detected
- **Mirror Check**: Cross-references offshore recommendations against security policy indicators

### Dashboard
- **Global Roll-up**: Aggregates all BUs showing total FTE savings, spend reduction, and AI Sentiment score
- **Cost-to-Risk Slider**: Adjustable prioritization between "Max Savings" and "Max Quality"
- **C-Suite Summary**: AI-generated 300-word executive briefing with one-click export

### Pre-loaded Data
42 roles across 6 business units with Scripps-logic defaults:
- L1/L2 roles default toward "Y" (offshore)
- L3/L4 and cultural-awareness roles default toward "N" (retain)

## Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=3001
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/business-units | List all BUs |
| GET | /api/business-units/:id | Get BU with roles |
| POST | /api/roles | Create role |
| PUT | /api/roles/:id | Update role |
| DELETE | /api/roles/:id | Delete role |
| GET | /api/dashboard/rollup | Global metrics |
| POST | /api/ai/rationale | Auto-generate rationale |
| POST | /api/ai/risk-assessment | Pro/con analysis |
| POST | /api/ai/insights | Quality loss check |
| POST | /api/ai/executive-summary | Generate C-Suite report |
