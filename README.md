# RhythmTraffic AI Chatbot

A complete AI-powered chatbot solution for **www.rhythmtraffic.com** that:
- Embeds on all website pages
- Reads and understands your website content
- Processes PDF and Word documents
- Acts as a friendly technical salesperson
- Books meetings with engineers

## Choose Your Setup

| Option | Best For | Chat Widget | CRM | Calendar |
|--------|----------|-------------|-----|----------|
| **GoHighLevel (GHL)** | All-in-one marketing | GHL Built-in | GHL CRM | GHL Calendar |
| **Custom Widget + n8n** | Full customization | Custom JS | Any CRM | Google/Calendly |

---

## Option 1: GoHighLevel (GHL) Setup

If you're using GoHighLevel, this is the easiest path - GHL already has a chat widget, CRM, and calendar built in.

### Architecture with GHL

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  GHL Chat Widget +---->+   n8n + AI       +---->+   GHL CRM        |
|  (Built-in)      |     |   (Processing)   |     |   + Calendar     |
|                  |     |                  |     |                  |
+------------------+     +--------+---------+     +------------------+
                                  |
                                  v
                         +--------+---------+
                         |                  |
                         |  Supabase        |
                         |  (Knowledge)     |
                         |                  |
                         +------------------+
```

### Step 1: Get Your GHL API Key

1. Log into GoHighLevel
2. Go to **Settings** > **Business Profile** > **API Keys**
3. Create a new API key with these permissions:
   - Conversations (Read/Write)
   - Contacts (Read/Write)
   - Calendars (Read/Write)
   - Appointments (Read/Write)
4. Copy the API key

### Step 2: Set Up n8n Credentials

In n8n, go to **Settings > Credentials** and add:

1. **GHL API Key** (Header Auth)
   - Name: `GHL API Key`
   - Name: `Authorization`
   - Value: `Bearer YOUR_GHL_API_KEY`

2. **OpenAI API**
   - Name: `OpenAI API`
   - API Key: Your OpenAI API key

3. **Supabase** (for knowledge base)
   - Name: `Supabase API`
   - Host: Your Supabase URL
   - API Key: Your Supabase service role key

### Step 3: Import GHL Workflow

1. Import `workflows/ghl-chatbot-workflow.json` into n8n
2. Update these values in the workflow:
   - `YOUR_GHL_CALENDAR_ID` - Your GHL calendar ID
   - `YOUR_ENGINEER_USER_ID` - The GHL user ID for your engineer

### Step 4: Configure GHL Webhook

1. In GHL, go to **Automation** > **Webhooks**
2. Create a new webhook:
   - **Trigger**: Inbound Message
   - **URL**: `https://your-n8n.com/webhook/ghl-chat`
3. Enable the webhook

### Step 5: Set Up GHL Chat Widget

1. In GHL, go to **Sites** > **Chat Widget**
2. Customize the appearance to match RhythmTraffic branding
3. Enable on all your funnels/websites
4. The widget is now AI-powered through n8n!

---

## Option 2: Custom Widget Setup

Use this if you want full control over the chat experience or don't use GHL.

### Architecture (Custom)

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Custom Widget   +---->+   n8n Webhook    +---->+   AI Processing  |
|  (JavaScript)    |     |   (Chat API)     |     |   (OpenAI)       |
|                  |     |                  |     |                  |
+------------------+     +--------+---------+     +--------+---------+
                                  |                        |
                                  v                        v
                         +--------+---------+     +--------+---------+
                         |                  |     |                  |
                         |  Supabase        |     |  Google Calendar |
                         |  (Knowledge)     |     |  (Booking)       |
                         |                  |     |                  |
                         +------------------+     +------------------+
```

### Prerequisites

- **n8n** (self-hosted or cloud) - [Install Guide](https://docs.n8n.io/hosting/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)
- **Supabase** (you already have this!)
- **Google Calendar** (for meeting booking)

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

### Step 2: Set Up Supabase for Vector Storage

Since you already have Supabase, enable pgvector:

```sql
-- Run this in Supabase SQL Editor

-- Enable the pgvector extension
create extension if not exists vector;

-- Create the documents table for knowledge base
create table documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- Create index for fast similarity search
create index on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create function for similarity search
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 5,
  filter jsonb default '{}'
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create chat_sessions table for memory
create table chat_sessions (
  id text primary key,
  messages jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Step 3: Set Up n8n Credentials

In n8n, go to **Settings > Credentials** and add:

1. **OpenAI API**
   - Name: `OpenAI API`
   - API Key: Your OpenAI API key

2. **Supabase API**
   - Name: `Supabase API`
   - Host: `https://YOUR_PROJECT.supabase.co`
   - Service Role Key: Your Supabase service role key

3. **Google Calendar OAuth2** (optional, for meeting booking)
   - Follow n8n's OAuth setup for Google Calendar

### Step 4: Import Workflows

Import these workflow files in n8n:

1. **Main Chatbot**: `workflows/chatbot-workflow.json`
2. **Document Ingestion**: `workflows/document-ingestion-workflow.json`
3. **Website Scraper**: `workflows/website-scraper-workflow.json`

**Important**: Update the workflows to use Supabase instead of Pinecone:
- Replace Pinecone nodes with Supabase nodes
- Use the `match_documents` function for similarity search

### Step 5: Embed the Widget

Add this code just before `</body>` on every page of rhythmtraffic.com:

```html
<!-- RhythmTraffic Chatbot -->
<script>
  window.RhythmTrafficConfig = {
    webhookUrl: 'https://your-n8n-instance.com/webhook/chat',
    primaryColor: '#2563eb',
    companyName: 'RhythmTraffic'
  };
</script>
<script src="https://your-cdn.com/chatbot-embed.js"></script>
```

---

## Ingesting Your Content

### Website Content

Run the Website Scraper workflow to index rhythmtraffic.com:

```bash
# Trigger manually
curl -X POST https://your-n8n.com/webhook/scrape-website
```

Or click "Execute Workflow" in n8n.

### Documents (PDFs, Word files)

1. Upload documents to a folder accessible by n8n
2. Update the folder path in the Document Ingestion workflow
3. Run the workflow:

```bash
curl -X POST https://your-n8n.com/webhook/ingest-documents
```

---

## Customizing the AI Personality

Edit the AI prompt in the workflow to adjust the chatbot's behavior:

```
You are a friendly and knowledgeable technical sales assistant for RhythmTraffic...
```

Key traits to customize:
- **Greeting style** - How warm/formal to be
- **Technical depth** - How detailed explanations should be
- **Sales approach** - Consultative vs. direct
- **Meeting booking** - When to offer meetings

---

## Supabase Alternative for Chat Memory

Instead of Redis, use Supabase for chat memory:

```javascript
// Save chat history to Supabase
const { data, error } = await supabase
  .from('chat_sessions')
  .upsert({
    id: sessionId,
    messages: chatHistory,
    updated_at: new Date().toISOString()
  });

// Retrieve chat history
const { data: session } = await supabase
  .from('chat_sessions')
  .select('messages')
  .eq('id', sessionId)
  .single();
```

---

## Free/Low-Cost AI Alternatives

### Instead of OpenAI

**Ollama (Free, Local):**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama run llama2
```

**Groq (Fast, Free Tier):**
- Get API key from groq.com
- Very fast inference

### Using Supabase AI (Coming Soon)

Supabase is adding built-in AI features - check their docs for updates.

---

## Troubleshooting

### Chat Not Responding

1. Check n8n workflow is active
2. Verify webhook URL is correct
3. Check browser console for CORS errors
4. Verify OpenAI API key is valid

### Documents Not Being Indexed

1. Check file paths are correct
2. Verify Supabase connection
3. Check that pgvector extension is enabled
4. Review n8n execution logs

### GHL Integration Issues

1. Verify GHL API key permissions
2. Check webhook URL in GHL settings
3. Confirm location ID and calendar ID are correct
4. Review GHL webhook logs

---

## File Structure

```
n8n/
├── README.md                              # This guide
├── workflows/
│   ├── chatbot-workflow.json             # Main chat (custom widget)
│   ├── ghl-chatbot-workflow.json         # GoHighLevel integration
│   ├── document-ingestion-workflow.json  # PDF/Word processing
│   └── website-scraper-workflow.json     # Website content ingestion
└── widget/
    ├── chatbot-widget.html               # Standalone demo page
    └── chatbot-embed.js                  # Embeddable widget script
```

---

## Production Checklist

- [ ] n8n deployed and accessible via HTTPS
- [ ] Supabase pgvector enabled and tables created
- [ ] OpenAI API key configured
- [ ] Website content indexed
- [ ] Documents uploaded and indexed
- [ ] Chat widget embedded on all pages
- [ ] GHL webhook configured (if using GHL)
- [ ] Calendar integration tested
- [ ] CORS configured for security

---

## Support

- **n8n Documentation**: https://docs.n8n.io
- **n8n Community**: https://community.n8n.io
- **Supabase Docs**: https://supabase.com/docs
- **GoHighLevel Docs**: https://help.gohighlevel.com
- **OpenAI API Docs**: https://platform.openai.com/docs

---

## License

MIT License - Customize freely for RhythmTraffic
