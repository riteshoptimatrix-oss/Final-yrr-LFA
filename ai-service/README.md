# Lead Finder AI Analysis Service

A FastAPI-powered Smart Business Analysis and Lead Qualification microservice without any LLMs or AI models.

## Features

- ✅ Deterministic scoring (no AI models)
- ✅ Business qualification
- ✅ Website analysis
- ✅ Opportunity detection
- ✅ Professional summaries
- ✅ FastAPI with async support
- ✅ MongoDB integration
- ✅ Node.js backend integration

## Architecture

```
Frontend (Next.js)
    ↓ HTTP
Node.js Backend
    ↓ HTTP
FastAPI AI Service
    ↓ MongoDB
Database
```

## Getting Started

### Prerequisites

- Python 3.11+
- pip package manager

### Installation

```bash
cd ai-service
pip install -r requirements.txt
```

### Configuration

Create a `.env` file:

```env
APP_NAME="Lead Finder AI Analysis Service"
APP_VERSION="1.0.0"
DEBUG=False
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
ANALYSIS_TIMEOUT=30
BULK_ANALYSIS_CONCURRENCY=5
```

### Running the Service

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will be available at `http://localhost:8000`

## API Endpoints

### Health Check

```
GET /api/v1/health
```

### Analyze Single Lead

```
POST /api/v1/analyze-lead
```

**Request Body:**
```json
{
  "companyName": "Test Company",
  "website": "https://testcompany.com",
  "category": "Business Services",
  "websiteStatus": "outdated-website",
  "sslEnabled": false,
  "responseTime": 4200,
  "metaTitle": "",
  "metaDescription": "",
  "hasContactPage": false,
  "hasSocialLinks": false,
  "rating": 3.2,
  "reviewsCount": 18,
  "leadScore": 70
}
```

**Response:**
```json
{
  "leadScore": 91,
  "qualificationLevel": "high-potential",
  "websiteWeaknesses": ["Missing SSL", "No contact page"],
  "businessOpportunities": ["Website redesign opportunity"],
  "summary": "Business has outdated website infrastructure...",
  "analysisTimestamp": "2024-06-09T15:30:00Z"
}
```

### Bulk Analyze Leads

```
POST /api/v1/bulk-analyze
```

**Request Body:**
```json
{
  "leads": [...],
  "batchSize": 10
}
```

### Score Only

```
POST /api/v1/score-only
```

Calculate only the score without full analysis.

## Scoring Logic

The service uses deterministic scoring based on website analysis:

### Scoring Factors

| Factor | Score Adjustment |
|--------|-----------------|
| No Website | +95 |
| Broken Website | +90 |
| No SSL | +20 |
| Missing Meta Title | +10 |
| Missing Meta Description | +10 |
| No Contact Page | +10 |
| No Social Links | +10 |
| Slow Website | +15 |
| Low Reviews | +5 |
| Outdated Website | +20 |

### Qualification Levels

- **High Potential:** 80-100
- **Medium Potential:** 50-79
- **Low Potential:** 0-49

## Directory Structure

```
ai-service/
├── app/
│   ├── routes/          # API routes
│   ├── services/        # Business logic engines
│   ├── models/          # Request/Response models
│   ├── utils/           # Helpers and constants
│   ├── config/          # Configuration
│   └── core/            # Exception handling, middleware
├── main.py              # Application entry point
└── requirements.txt     # Python dependencies
```

## Business Logic Engines

### ScoringEngine

- Calculates lead scores (0-100)
- Determines qualification levels
- Normalizes scores

### QualificationEngine

- Qualifies leads based on score
- Generates professional summaries
- Identifies weaknesses and opportunities

### WebsiteAnalysisEngine

- Analyzes website status
- Checks SSL status
- Evaluates performance

### BusinessOpportunityEngine

- Identifies business opportunities
- Generates opportunity suggestions
- Prioritizes recommendations

### SummaryEngine

- Generates professional summaries
- Creates action items
- Provides business recommendations

## Integration with Node.js Backend

Update your Node.js backend `.env`:

```env
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=30000
```

The backend will automatically use the AI service for lead analysis.

## Development

### Running with Auto-Reload

```bash
uvicorn main:app --reload
```

### Type Checking

```bash
pip install mypy
mypy app/
```

### Linting

```bash
pip install flake8
flake8 app/
```

## Production Deployment

### Using Gunicorn

```bash
pip install gunicorn
gunicorn main:app --bind 0.0.0.0:8000 --workers 4
```

### Docker (Example)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY main.py .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Troubleshooting

### Port Already in Use

Change the port in `.env`:
```env
PORT=8001
```

### Connection Timeout

Increase the timeout in `.env`:
```env
ANALYSIS_TIMEOUT=60
```

### Health Check Fails

1. Check if service is running
2. Verify the port
3. Check logs for errors

## License

MIT License

## Support

For issues and feature requests, please create an issue in the main repository.
