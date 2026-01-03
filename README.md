# RhythmTraffic AI Chatbot

A complete AI-powered chatbot solution for **www.rhythmtraffic.com** that:
- Embeds on all website pages
- Reads and understands your website content
- Processes PDF and Word documents
- Acts as a friendly technical salesperson
- Books meetings with engineers

## Architecture Overview

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Website Widget  +---->+   n8n Webhook    +---->+   AI Processing  |
|  (JavaScript)    |     |   (Chat API)     |     |   (OpenAI)       |
|                  |     |                  |     |                  |
+------------------+     +--------+---------+     +--------+---------+
                                  |                        |
                                  v                        v
                         +--------+---------+     +--------+---------+
                         |                  |     |                  |
                         |  Vector Store    |     |  Calendar/Email  |
                         |  (Knowledge)     |     |  (Booking)       |
                         |                  |     |                  |
                         +------------------+     +------------------+
```

## Quick Start

### Prerequisites

- **n8n** (self-hosted or cloud) - [Install Guide](https://docs.n8n.io/hosting/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)
- **Vector Database** (choose one):
  - Pinecone (recommended, free tier available)
  - Qdrant (self-hosted option)
  - Supabase with pgvector
- **Redis** (for chat memory) - or use n8n's built-in memory
- **Google Calendar** (for meeting booking)
- **Gmail or SMTP** (for confirmation emails)

### Step 1: Install n8n

```bash
# Using Docker (recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Or using npm
npm install n8n -g
n8n start
```

Access n8n at: `http://localhost:5678`

### Step 2: Set Up Credentials

In n8n, go to **Settings > Credentials** and add:

1. **OpenAI API**
   - Name: `OpenAI API`
   - API Key: Your OpenAI API key

2. **Pinecone** (or your chosen vector DB)
   - Name: `Pinecone API`
   - API Key: Your Pinecone API key
   - Environment: Your Pinecone environment

3. **Redis**
   - Name: `Redis`
   - Host: `localhost` (or your Redis host)
   - Port: `6379`

4. **Google Calendar OAuth2**
   - Follow n8n's OAuth setup for Google Calendar

5. **Gmail OAuth2**
   - Follow n8n's OAuth setup for Gmail

### Step 3: Import Workflows

Import the following workflow files in n8n:

1. **Main Chatbot**: `workflows/chatbot-workflow.json`
2. **Document Ingestion**: `workflows/document-ingestion-workflow.json`
3. **Website Scraper**: `workflows/website-scraper-workflow.json`

To import:
1. Click **Workflows** > **Import from File**
2. Select each JSON file
3. Update credential references to match your credentials

### Step 4: Configure the Widget

1. Open `widget/chatbot-embed.js`
2. Update the webhook URL:

```javascript
window.RhythmTrafficConfig = {
    webhookUrl: 'https://your-n8n-instance.com/webhook/chat',
    primaryColor: '#2563eb',  // Customize your brand color
    companyName: 'RhythmTraffic'
};
```

3. Host the widget file on your server or CDN

### Step 5: Embed on Your Website

Add this code just before `</body>` on every page:

```html
<!-- RhythmTraffic Chatbot -->
<script>
  window.RhythmTrafficConfig = {
    webhookUrl: 'https://your-n8n-instance.com/webhook/chat'
  };
</script>
<script src="https://your-cdn.com/chatbot-embed.js"></script>
```

### Step 6: Ingest Your Content

1. **Website Content**: Run the Website Scraper workflow
   - Click "Execute Workflow" in n8n
   - Or call: `POST https://your-n8n-instance.com/webhook/scrape-website`

2. **Documents**: Place PDFs/Word docs in your documents folder
   - Run the Document Ingestion workflow
   - Or call: `POST https://your-n8n-instance.com/webhook/ingest-documents`

---

## Detailed Configuration

### Customizing the AI Personality

Edit the AI prompt in `chatbot-workflow.json`:

```
You are a friendly and knowledgeable technical sales assistant for RhythmTraffic...
```

Key personality traits to customize:
- Greeting style
- Technical depth
- Sales approach
- Meeting booking behavior

### Adding More Website Pages

Edit the `Define Pages to Scrape` node in the Website Scraper workflow:

```javascript
const pages = [
  { url: baseUrl, name: 'Home' },
  { url: `${baseUrl}/about`, name: 'About Us' },
  // Add more pages here
  { url: `${baseUrl}/your-new-page`, name: 'New Page' }
];
```

### Vector Database Alternatives

**Using Qdrant (Self-Hosted):**
```bash
docker run -p 6333:6333 qdrant/qdrant
```
Replace Pinecone nodes with Qdrant nodes in the workflows.

**Using Supabase:**
1. Enable pgvector extension in Supabase
2. Use the Supabase Vector Store node

### Memory Options

**Using n8n Memory (Simpler):**
Replace Redis nodes with n8n's built-in Memory nodes for smaller deployments.

**Using PostgreSQL:**
Store chat history in PostgreSQL for better persistence.

---

## Meeting Booking Setup

### Google Calendar Integration

1. Create a Google Cloud project
2. Enable Google Calendar API
3. Create OAuth2 credentials
4. Add redirect URL: `https://your-n8n.com/rest/oauth2-credential/callback`
5. Configure in n8n credentials

### Calendly Alternative

Replace the Google Calendar node with a Calendly webhook:

```javascript
// In the booking flow, call Calendly's API
const calendlyResponse = await fetch('https://calendly.com/api/v2/scheduling_links', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${calendlyToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    owner: 'https://api.calendly.com/users/YOUR_USER_ID',
    max_event_count: 1
  })
});
```

---

## Free/Low-Cost Alternatives

### Instead of OpenAI

**Ollama (Free, Local):**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Run Llama 2
ollama run llama2
```

Use the Ollama node in n8n instead of OpenAI.

**Groq (Fast, Free Tier):**
- Get API key from groq.com
- Use HTTP Request node with Groq's API

### Instead of Pinecone

**ChromaDB (Free, Self-Hosted):**
```bash
pip install chromadb
```

**LanceDB (Free, Serverless):**
Embedded vector database, no server needed.

---

## Troubleshooting

### Chat Not Responding

1. Check n8n workflow is active
2. Verify webhook URL is correct
3. Check browser console for CORS errors
4. Verify OpenAI API key is valid

### Documents Not Being Indexed

1. Check file paths are correct
2. Verify document formats (PDF, DOCX, DOC, TXT)
3. Check vector database connection
4. Review n8n execution logs

### Meeting Booking Fails

1. Verify Google Calendar OAuth is valid
2. Check calendar permissions
3. Review email sending credentials

---

## Production Deployment

### Recommended Setup

1. **n8n**: Deploy on Railway, Render, or self-host on VPS
2. **Redis**: Use Upstash (free tier) or managed Redis
3. **Vector DB**: Pinecone free tier or Qdrant Cloud
4. **Widget**: Host on your website's CDN

### Security Considerations

1. Enable CORS restrictions in webhook
2. Add rate limiting
3. Sanitize user inputs
4. Use HTTPS everywhere
5. Store API keys securely

### Scaling

- Use n8n queue mode for high traffic
- Scale vector database as knowledge grows
- Consider caching frequent queries

---

## File Structure

```
n8n/
├── README.md                              # This guide
├── workflows/
│   ├── chatbot-workflow.json             # Main chat handling
│   ├── document-ingestion-workflow.json  # PDF/Word processing
│   └── website-scraper-workflow.json     # Website content ingestion
└── widget/
    ├── chatbot-widget.html               # Standalone demo page
    └── chatbot-embed.js                  # Embeddable widget script
```

---

## Support

- **n8n Documentation**: https://docs.n8n.io
- **n8n Community**: https://community.n8n.io
- **OpenAI API Docs**: https://platform.openai.com/docs

---

## License

MIT License - Feel free to customize for RhythmTraffic
