# Kiro Web Mind API Documentation

## Overview

The Kiro Web Mind API provides programmatic access to AI processing, user data management, and automation features. The API is built on Firebase Cloud Functions and follows REST principles.

## Base URL

```
Production: https://us-central1-kiro-web-mind.cloudfunctions.net
Development: http://localhost:5001/kiro-web-mind/us-central1
```

## Authentication

All API requests require authentication using Firebase Auth tokens.

### Getting an Auth Token

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const token = await userCredential.user.getIdToken();
```

### Using the Token

Include the token in the Authorization header:

```
Authorization: Bearer <your-firebase-token>
```

## API Endpoints

### AI Processing

#### POST /api/ai/summarize

Summarize text content using AI.

**Request:**
```json
{
  "content": "Long text content to summarize...",
  "length": "brief" | "standard" | "detailed",
  "context": {
    "url": "https://example.com",
    "title": "Article Title",
    "pageType": "article"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Generated summary text...",
    "keyPoints": ["Point 1", "Point 2", "Point 3"],
    "readingTime": 120,
    "confidence": 0.95
  }
}
```

#### POST /api/ai/suggestions

Get contextual suggestions based on content.

**Request:**
```json
{
  "context": {
    "url": "https://example.com",
    "title": "Page Title",
    "content": "Page content...",
    "selectedText": "Optional selected text",
    "pageType": "article" | "form" | "search" | "social"
  },
  "userPreferences": {
    "interests": ["AI", "Technology"],
    "suggestionTypes": ["research", "actions", "automation"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "research",
        "title": "Find related articles",
        "description": "Discover more content on this topic",
        "action": "search",
        "confidence": 0.9
      }
    ]
  }
}
```

#### POST /api/ai/voice-command

Process voice commands and return structured responses.

**Request:**
```json
{
  "transcript": "Summarize this page",
  "context": {
    "url": "https://example.com",
    "pageType": "article"
  },
  "confidence": 0.95
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intent": "summarize",
    "action": "summarize_page",
    "parameters": {
      "target": "current_page",
      "length": "standard"
    },
    "response": "I'll summarize this page for you."
  }
}
```

### User Data Management

#### GET /api/user/profile

Get user profile and preferences.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "email": "user@example.com",
    "preferences": {
      "privacy": {
        "dataCollection": "standard",
        "cloudSync": true
      },
      "ui": {
        "theme": "dark",
        "sidebarPosition": "right"
      },
      "ai": {
        "summaryLength": "brief",
        "voiceEnabled": true
      }
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "lastActive": "2024-01-15T12:00:00Z"
  }
}
```

#### PUT /api/user/preferences

Update user preferences.

**Request:**
```json
{
  "preferences": {
    "privacy": {
      "dataCollection": "minimal"
    },
    "ui": {
      "theme": "light"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

#### GET /api/user/activity

Get user activity history with pagination.

**Query Parameters:**
- `limit`: Number of items per page (default: 50, max: 100)
- `offset`: Number of items to skip
- `startDate`: ISO date string for filtering
- `endDate`: ISO date string for filtering
- `type`: Activity type filter

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity123",
        "timestamp": "2024-01-15T12:00:00Z",
        "type": "page_visit",
        "url": "https://example.com",
        "title": "Example Article",
        "context": {
          "pageType": "article",
          "readingTime": 300
        },
        "aiActions": ["summarize", "save"]
      }
    ],
    "pagination": {
      "total": 1250,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Knowledge Graph

#### GET /api/knowledge/graph

Get user's knowledge graph data.

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "node1",
        "label": "Artificial Intelligence",
        "type": "topic",
        "strength": 0.9,
        "connections": ["node2", "node3"],
        "metadata": {
          "firstSeen": "2024-01-01T00:00:00Z",
          "lastUpdated": "2024-01-15T12:00:00Z",
          "interactionCount": 25
        }
      }
    ],
    "edges": [
      {
        "source": "node1",
        "target": "node2",
        "weight": 0.8,
        "type": "related_topic"
      }
    ]
  }
}
```

#### POST /api/knowledge/update

Update knowledge graph with new information.

**Request:**
```json
{
  "nodes": [
    {
      "label": "Machine Learning",
      "type": "topic",
      "context": {
        "url": "https://example.com/ml-article",
        "source": "article_read"
      }
    }
  ],
  "relationships": [
    {
      "from": "Artificial Intelligence",
      "to": "Machine Learning",
      "type": "subtopic",
      "strength": 0.9
    }
  ]
}
```

### Automation

#### GET /api/automation/rules

Get user's automation rules.

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "rule123",
        "name": "Auto-summarize articles",
        "isActive": true,
        "trigger": {
          "type": "page_load",
          "conditions": {
            "pageType": "article",
            "minWordCount": 500
          }
        },
        "actions": [
          {
            "type": "summarize",
            "parameters": {
              "length": "brief",
              "autoSave": true
            }
          }
        ],
        "executionCount": 45,
        "lastExecuted": "2024-01-15T11:30:00Z"
      }
    ]
  }
}
```

#### POST /api/automation/rules

Create a new automation rule.

**Request:**
```json
{
  "name": "Auto-save research articles",
  "trigger": {
    "type": "page_load",
    "conditions": {
      "urlPattern": "*.edu/*",
      "pageType": "article"
    }
  },
  "actions": [
    {
      "type": "save_to_knowledge",
      "parameters": {
        "category": "research",
        "tags": ["academic"]
      }
    }
  ]
}
```

#### PUT /api/automation/rules/:ruleId

Update an existing automation rule.

#### DELETE /api/automation/rules/:ruleId

Delete an automation rule.

#### POST /api/automation/execute

Manually execute an automation rule.

**Request:**
```json
{
  "ruleId": "rule123",
  "context": {
    "url": "https://example.com",
    "content": "Page content..."
  }
}
```

### Integration Services

#### GET /api/integrations

Get available service integrations.

**Response:**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "service": "gmail",
        "isConnected": true,
        "permissions": ["read", "compose"],
        "lastSync": "2024-01-15T12:00:00Z"
      },
      {
        "service": "notion",
        "isConnected": false,
        "availablePermissions": ["read", "write"]
      }
    ]
  }
}
```

#### POST /api/integrations/:service/connect

Connect to an external service.

#### DELETE /api/integrations/:service/disconnect

Disconnect from an external service.

#### POST /api/integrations/:service/sync

Trigger manual sync with connected service.

## Error Handling

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is missing required parameters",
    "details": {
      "missingFields": ["content"]
    }
  }
}
```

### Error Codes

- `INVALID_REQUEST`: Malformed or missing required data
- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Requested resource not found
- `RATE_LIMITED`: Too many requests
- `AI_SERVICE_ERROR`: AI processing failed
- `INTERNAL_ERROR`: Server-side error

## Rate Limiting

API requests are rate-limited per user:

- **AI Processing**: 100 requests per hour
- **Data Queries**: 1000 requests per hour
- **Updates**: 500 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## Webhooks

Kiro supports webhooks for real-time notifications.

### Webhook Events

- `automation.executed`: When an automation rule is triggered
- `knowledge.updated`: When knowledge graph is updated
- `ai.processed`: When AI processing completes

### Webhook Payload

```json
{
  "event": "automation.executed",
  "timestamp": "2024-01-15T12:00:00Z",
  "userId": "user123",
  "data": {
    "ruleId": "rule123",
    "context": {
      "url": "https://example.com"
    },
    "result": {
      "success": true,
      "actions": ["summarize", "save"]
    }
  }
}
```

## SDK and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @kiro/web-mind-sdk
```

```javascript
import { KiroClient } from '@kiro/web-mind-sdk';

const client = new KiroClient({
  apiKey: 'your-api-key',
  baseURL: 'https://us-central1-kiro-web-mind.cloudfunctions.net'
});

// Summarize content
const summary = await client.ai.summarize({
  content: 'Long article content...',
  length: 'brief'
});

// Get user activity
const activity = await client.user.getActivity({
  limit: 20,
  startDate: '2024-01-01'
});
```

### Chrome Extension Integration

```javascript
// In your Chrome extension
chrome.runtime.sendMessage({
  type: 'KIRO_API_REQUEST',
  endpoint: '/api/ai/summarize',
  data: { content: pageContent }
}, (response) => {
  if (response.success) {
    displaySummary(response.data.summary);
  }
});
```

## Examples

### Complete Integration Example

```javascript
class KiroIntegration {
  constructor(authToken) {
    this.authToken = authToken;
    this.baseURL = 'https://us-central1-kiro-web-mind.cloudfunctions.net';
  }

  async summarizePage(url, content) {
    const response = await fetch(`${this.baseURL}/api/ai/summarize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        context: { url, pageType: 'article' }
      })
    });

    return await response.json();
  }

  async createAutomation(name, trigger, actions) {
    const response = await fetch(`${this.baseURL}/api/automation/rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, trigger, actions })
    });

    return await response.json();
  }
}
```

## Testing

### API Testing Environment

Use our testing environment for development:

```
Base URL: https://us-central1-kiro-web-mind-dev.cloudfunctions.net
```

### Postman Collection

Download our Postman collection for easy API testing:
[Kiro API Collection](./postman/kiro-api-collection.json)

---

For more information, see our [Developer Guide](../developer-guide.md) or contact our API support team at api-support@kiro-web-mind.com.