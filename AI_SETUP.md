# AI Agents Setup Guide

This project uses **Vercel AI SDK** with **Anthropic Claude** to provide intelligent climate analysis and risk assessment.

## 🤖 AI Agents

### 1. **Climate Analyst**
Expert in climate data analysis and risk assessment for Rwanda.

**Capabilities:**
- Analyze rainfall patterns and trends
- Interpret NDVI vegetation health data
- Assess temperature and solar radiation impacts
- Provide climate risk forecasts
- Explain technical climate data in simple terms

**Tools Available:**
- `getRainfallData` - CHIRPS rainfall time series
- `getTemperatureData` - NASA POWER temperature data
- `getElevationData` - SRTM terrain analysis
- `assessFloodRisk` - Comprehensive flood risk calculation
- `getDroughtRisk` - Drought assessment

---

### 2. **Flood Risk Assessor**
Specialist in flood forecasting and early warning systems.

**Capabilities:**
- Real-time flood risk assessment
- Identify high-risk areas and vulnerable communities
- Analyze rainfall-elevation-slope combinations
- Provide early warning recommendations
- Suggest flood mitigation strategies

**Tools Available:**
- `getRainfallData` - Recent rainfall analysis
- `getElevationData` - Terrain and slope data
- `assessFloodRisk` - Multi-factor flood risk score

---

### 3. **Agricultural Advisor**
Helps Rwandan farmers adapt to climate conditions.

**Capabilities:**
- Crop health monitoring using NDVI
- Optimal planting/harvesting timing
- Drought and flood impact on agriculture
- Irrigation recommendations
- Climate adaptation strategies

**Tools Available:**
- `getRainfallData` - Precipitation patterns
- `getTemperatureData` - Growing season analysis
- `getDroughtRisk` - Water stress assessment

---

## 🔑 Required API Keys

### **1. Anthropic API Key** (Required)

Get your key from: https://console.anthropic.com/

**Add to `.env` file:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Pricing:**
- Claude 3.5 Sonnet: $3.00 / 1M input tokens, $15.00 / 1M output tokens
- Claude 3 Haiku (fast mode): $0.25 / 1M input tokens, $1.25 / 1M output tokens

**Free Tier:**
- New accounts get $5 free credit
- No credit card required for testing

---

## 📦 Installation Steps

### Step 1: Install Dependencies
```bash
npm install ai @ai-sdk/anthropic
```

✅ **Already installed!**

### Step 2: Add Environment Variables
Add to your `.env` file:
```bash
ANTHROPIC_API_KEY=your_key_here
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

---

## 🎯 Usage

### In Your Application

#### Option 1: Use the Chat Component
```tsx
import { ClimateChat } from '@/components/climate-chat';

export default function Page() {
  return (
    <ClimateChat agent="climateAnalyst" />
  );
}
```

#### Option 2: Direct API Call
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is the flood risk near Kigali?' }
    ],
    agent: 'floodRiskAssessor'
  })
});
```

---

## 🛠️ AI Tools (Functions)

The AI agents can call these tools to fetch real climate data:

### `getRainfallData`
```typescript
{
  latitude: -1.9403,
  longitude: 29.8739,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
}
// Returns: total rainfall, daily averages, recent trends
```

### `getTemperatureData`
```typescript
{
  latitude: -1.9403,
  longitude: 29.8739,
  startDate: '20240101',
  endDate: '20240131'
}
// Returns: temperature, min/max, solar radiation
```

### `getElevationData`
```typescript
{
  latitude: -1.9403,
  longitude: 29.8739
}
// Returns: elevation, slope, terrain analysis
```

### `assessFloodRisk`
```typescript
{
  latitude: -1.9403,
  longitude: 29.8739
}
// Returns: risk level, score, contributing factors
```

### `getDroughtRisk`
```typescript
{
  latitude: -1.9403,
  longitude: 29.8739,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
}
// Returns: drought risk, rainfall deficit, severity
```

---

## 💬 Example Queries

**Climate Analysis:**
- "What were the rainfall patterns in Kigali over the last 30 days?"
- "Analyze the temperature trends for agricultural planning"
- "What is the vegetation health in the Eastern Province?"

**Flood Risk:**
- "Assess flood risk near Lake Kivu"
- "Which areas are most vulnerable to flooding this week?"
- "What is causing high flood risk in Nyabarongo River Basin?"

**Agricultural Advice:**
- "When should farmers plant maize based on current conditions?"
- "How is the drought affecting crops in the Southern Province?"
- "What irrigation strategy do you recommend?"

---

## 🔒 Security Notes

1. **API Keys:** Never commit `.env` files to git
2. **Edge Runtime:** API routes use edge runtime for faster responses
3. **Rate Limiting:** Anthropic has rate limits (check your tier)
4. **Error Handling:** All tools include error handling for failed API calls

---

## 📊 Monitoring

Check AI usage:
- Anthropic Console: https://console.anthropic.com/
- View token usage and costs
- Monitor API errors

---

## 🚀 Next Steps

1. **Add to your pages:**
   ```tsx
   import { ClimateChat } from '@/components/climate-chat';
   ```

2. **Customize agents:**
   - Edit `src/lib/ai/config.ts` to modify system prompts
   - Add new tools in `src/lib/ai/tools.ts`

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```
   Add `ANTHROPIC_API_KEY` in Vercel dashboard → Settings → Environment Variables

---

## 📝 Files Created

- `src/lib/ai/config.ts` - AI models and system prompts
- `src/lib/ai/tools.ts` - Climate data tools (functions)
- `src/app/api/chat/route.ts` - API endpoint
- `src/components/climate-chat.tsx` - Chat UI component
- `AI_SETUP.md` - This documentation

---

## ❓ Troubleshooting

**"Invalid API key":**
- Check `ANTHROPIC_API_KEY` in `.env`
- Restart dev server

**"Tool execution failed":**
- Verify CHIRPS, NASA POWER, SRTM APIs are accessible
- Check network connectivity

**"Rate limit exceeded":**
- Wait a few minutes
- Upgrade Anthropic tier if needed

---

For support: https://docs.anthropic.com/
