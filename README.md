# RhythmTraffic AI Chatbot

A complete AI-powered chatbot solution for **www.rhythmtraffic.com** that:
- Free custom chat widget embedded on all pages
- AI-powered responses using OpenAI GPT-4o-mini
- Reads your website content and documents (PDF/Word)
- Acts as a friendly technical salesperson
- Sends leads to GoHighLevel CRM
- Books meetings with engineers

## Architecture

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Free Custom     +---->+   n8n Webhook    +---->+   OpenAI         |
|  Chat Widget     |     |                  |     |   GPT-4o-mini    |
|                  |     |                  |     |                  |
+------------------+     +--------+---------+     +------------------+
                                  |
                    +-------------+-------------+
                    |             |             |
                    v             v             v
            +-------+---+  +------+----+  +-----+------+
            |           |  |           |  |            |
            | Supabase  |  |   GHL     |  |    GHL     |
            | (Memory + |  |   CRM     |  |  Calendar  |
            | Knowledge)|  | (Contacts)|  | (Meetings) |
            |           |  |           |  |            |
            +-----------+  +-----------+  +------------+
```

**What's Free:**
- Chat widget (custom JavaScript)
- n8n (self-hosted)
- Supabase (free tier: 500MB database)

**What Costs:**
- OpenAI API (~$0.15 per 1M tokens - very cheap)
- GHL subscription (you likely already have this)

---

## Quick Start

### Step 1: Set Up Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable vector extension
create extension if not exists vector;

-- Knowledge base table
create table documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamp with time zone default now()
);

-- Fast similarity search index
create index on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Chat sessions table
create table chat_sessions (
  id text primary key,
  messages jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Vector search function
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 5
)
returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql as $$
begin
  return query
  select documents.id, documents.content, documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Get chat session function
create or replace function get_chat_session(session_id text)
returns json language plpgsql as $$
declare result json;
begin
  select json_build_object('id', id, 'messages', messages, 'metadata', metadata)
  into result from chat_sessions where id = session_id;
  return coalesce(result, '{}'::json);
end;
$$;
```

### Step 2: Install n8n

```bash
# Using Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  -e SUPABASE_KEY="your-service-role-key" \
  -e GHL_LOCATION_ID="your-ghl-location-id" \
  -e GHL_CALENDAR_ID="your-ghl-calendar-id" \
  -e GHL_ENGINEER_USER_ID="your-engineer-user-id" \
  n8nio/n8n
```

### Step 3: Set Up Credentials in n8n

Go to **Settings > Credentials** and add:

1. **OpenAI API**
   - Name: `OpenAI API`
   - API Key: Your key from platform.openai.com

2. **GHL API Key** (Header Auth type)
   - Name: `GHL API Key`
   - Header Name: `Authorization`
   - Header Value: `Bearer YOUR_GHL_API_KEY`

### Step 4: Import the Workflow

1. In n8n, click **Workflows > Import from File**
2. Import: `workflows/chatbot-custom-widget-ghl-crm.json`
3. Activate the workflow

### Step 5: Get Your Webhook URL

After activating, your webhook URL will be:
```
https://your-n8n-domain.com/webhook/chat
```

### Step 6: Embed Widget on Your Website

Add this before `</body>` on every page of rhythmtraffic.com:

```html
<!-- RhythmTraffic AI Chatbot -->
<script>
  window.RhythmTrafficConfig = {
    webhookUrl: 'https://your-n8n-domain.com/webhook/chat',
    primaryColor: '#2563eb',
    companyName: 'RhythmTraffic'
  };
</script>
<script src="https://your-cdn.com/chatbot-embed.js"></script>
```

Host `widget/chatbot-embed.js` on your server or CDN.

---

## How It Works

### Chat Flow:

1. **Visitor opens chat** → Free widget appears
2. **Visitor asks question** → Sent to n8n webhook
3. **n8n searches knowledge base** → Supabase vector search
4. **OpenAI generates response** → Friendly, helpful answer
5. **Response sent back** → Displayed in widget

### Lead Capture Flow:

1. **Visitor shares email/phone** → Detected automatically
2. **Contact created in GHL** → Tagged as "chatbot-lead"
3. **Session linked to contact** → Full conversation saved

### Meeting Booking Flow:

1. **Visitor wants to talk to engineer** → AI offers to book
2. **Visitor provides email** → Appointment created in GHL
3. **Engineer notified** → Via GHL notifications

---

## Ingest Your Content

### Index Your Website

```bash
# Import and run the website scraper workflow
curl -X POST https://your-n8n.com/webhook/scrape-website
```

### Index Documents (PDFs, Word)

1. Upload documents to a folder
2. Update path in `document-ingestion-workflow.json`
3. Run the workflow

---

## GHL Configuration

### Get Your GHL IDs

**Location ID:**
1. GHL Dashboard → Settings → Business Profile
2. Copy the Location ID

**Calendar ID:**
1. GHL → Calendars → Select your calendar
2. Copy the Calendar ID from URL

**Engineer User ID:**
1. GHL → Team Management
2. Click on the engineer's profile
3. Copy User ID from URL

### What Gets Sent to GHL

| Event | GHL Action |
|-------|------------|
| Visitor shares email | Create Contact (tagged "chatbot-lead") |
| Visitor shares phone | Add to Contact |
| Visitor wants meeting | Create Appointment |
| Meeting booked | Add note to Contact |

---

## Customize the AI

Edit the system prompt in the workflow to change personality:

```
You are a friendly and knowledgeable technical sales assistant for RhythmTraffic...
```

Adjust:
- **Tone**: More formal or casual
- **Knowledge depth**: Technical vs. simple explanations
- **Sales style**: Consultative vs. direct
- **When to ask for contact info**

---

## File Structure

```
n8n/
├── README.md
├── supabase/
│   └── setup.sql                              # Full Supabase setup
├── workflows/
│   ├── chatbot-custom-widget-ghl-crm.json     # ★ RECOMMENDED - Use this one
│   ├── chatbot-supabase-workflow.json         # Without GHL integration
│   ├── document-ingestion-workflow.json       # PDF/Word processing
│   └── website-scraper-workflow.json          # Index your website
└── widget/
    ├── chatbot-widget.html                    # Demo/test page
    └── chatbot-embed.js                       # Embed on your site
```

---

## Troubleshooting

### Chat not responding
1. Is n8n workflow active?
2. Check webhook URL in widget config
3. Check browser console for errors

### Leads not appearing in GHL
1. Verify GHL API key permissions
2. Check Location ID is correct
3. Review n8n execution logs

### AI responses are off
1. Run website scraper to index content
2. Add more documents to knowledge base
3. Adjust the system prompt

---

## Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| n8n (self-hosted) | Free |
| Supabase (free tier) | Free |
| OpenAI API (1000 chats) | ~$2-5 |
| GHL | Your existing subscription |
| **Total** | **~$2-5/month** |

---

## Support

- **n8n**: https://docs.n8n.io
- **Supabase**: https://supabase.com/docs
- **GHL API**: https://highlevel.stoplight.io/docs/integrations
- **OpenAI**: https://platform.openai.com/docs
