# OpenAI AI Agents Setup Guide

This project uses **Vercel AI SDK** with **OpenAI GPT-4** to provide intelligent climate analysis and risk assessment.

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

---

### 3. **Agricultural Advisor**
Helps Rwandan farmers adapt to climate conditions.

**Capabilities:**
- Crop health monitoring using NDVI
- Optimal planting/harvesting timing
- Drought and flood impact on agriculture
- Irrigation recommendations
- Climate adaptation strategies

---

## 🔑 Required API Key

### **OpenAI API Key** (Required)

**Get your key:**
1. Go to: https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-` or `sk-`)

**Add to `.env` file:**
```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

**Pricing:**
- **GPT-4 Turbo**: $10/1M input tokens, $30/1M output tokens
- **GPT-3.5 Turbo**: $0.50/1M input tokens, $1.50/1M output tokens

**Free Tier:**
- New accounts: $5 free credit (expires after 3 months)
- Credit card required

---

## 📦 Installation

### ✅ Already Done:
```bash
npm install ai @ai-sdk/openai
```

### Your Steps:

**1. Add API key to `.env`:**
```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

**2. Restart dev server:**
```bash
npm run dev
```

---

## 🎯 Usage

### Add Chat Component to Your Page:

```tsx
import { ClimateChat } from '@/components/climate-chat';

export default function AnalysisPage() {
  return (
    <div className="container p-4">
      <h1>Climate Intelligence</h1>
      <ClimateChat agent="climateAnalyst" />
    </div>
  );
}
```

### Choose Different Agents:

```tsx
// Climate analysis
<ClimateChat agent="climateAnalyst" />

// Flood risk assessment
<ClimateChat agent="floodRiskAssessor" />

// Agricultural advice
<ClimateChat agent="agriculturalAdvisor" />
```

---

## 💬 Example Queries

**Climate Analysis:**
- "What were the rainfall patterns in Kigali over the last 30 days?"
- "Analyze the temperature trends for agricultural planning"
- "What is the vegetation health in Eastern Rwanda?"

**Flood Risk:**
- "Assess flood risk near Lake Kivu at coordinates -1.7, 29.2"
- "Which areas have highest flood risk based on recent rainfall?"
- "Calculate flood risk for Kigali city center"

**Agricultural Advice:**
- "When should farmers plant maize based on current conditions?"
- "How is the drought affecting crops in Southern Province?"
- "What irrigation strategy do you recommend for the dry season?"

---

## 🛠️ AI Tools (Functions)

The agents can call these tools to fetch real climate data:

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

### `assessFloodRisk`
```typescript
{
  latitude: -1.9403,
  longitude: 29.8739
}
// Returns: risk level (extreme/high/medium/low), score, factors
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

## 📊 Monitoring

**Check AI usage:**
- Dashboard: https://platform.openai.com/usage
- View token consumption
- Track costs
- Set spending limits

**Recommended limits:**
- Development: $10/month
- Production: Set based on usage

---

## 💰 Cost Estimation

**Average query with tools:**
- Input: ~800 tokens
- Output: ~400 tokens
- Cost: ~$0.02 per query (GPT-4 Turbo)

**Your $5 credit = ~250 conversations**

---

## 🔒 Security

1. **Never commit `.env`** files
2. **Use environment variables** in Vercel/production
3. **Set spending limits** in OpenAI dashboard
4. **Rotate keys** if exposed

---

## ❓ Troubleshooting

**"Invalid API key":**
- Check `OPENAI_API_KEY` in `.env`
- Ensure it starts with `sk-proj-` or `sk-`
- Restart dev server after adding key

**"Insufficient quota":**
- Check usage: https://platform.openai.com/usage
- Add billing method
- Upgrade tier if needed

**"Tool execution failed":**
- Verify CHIRPS, NASA POWER APIs are accessible
- Check network connectivity
- Review API logs

**"Rate limit exceeded":**
- Wait a few minutes
- Upgrade to higher tier
- Implement request queuing

---

## 🚀 Deploy to Vercel

```bash
vercel
```

**Add environment variable in Vercel dashboard:**
1. Go to Settings → Environment Variables
2. Add `OPENAI_API_KEY`
3. Paste your key
4. Redeploy

---

## 📝 Files Reference

- **Config**: `src/lib/ai/config.ts` - AI models & prompts
- **Tools**: `src/lib/ai/tools.ts` - Climate data functions
- **API**: `src/app/api/chat/route.ts` - Chat endpoint
- **UI**: `src/components/climate-chat.tsx` - Chat component

---

## 🎓 Learn More

- Vercel AI SDK: https://sdk.vercel.ai/docs
- OpenAI API: https://platform.openai.com/docs
- Function calling: https://platform.openai.com/docs/guides/function-calling

---

**Ready to go! Add your OpenAI API key and start using AI climate intelligence!** 🌍🤖
