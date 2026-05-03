# TrailMate AI Training - Quick Start

## 🎯 Objective
Fine-tune the Grok model with 20+ curated examples to improve the TrailMate chatbot's responses about Pakistan travel, destinations, guides, and bookings.

## ✅ What's Been Set Up

1. **Training Data** (`lib/ai/training-data.jsonl`)
   - 20+ diverse conversation examples
   - Covers destinations (Hunza, Skardu, Lahore, Islamabad, Fairy Meadows)
   - Guides user through booking, payments, guide discovery
   - Travel advice, packing, safety, accommodation

2. **Fine-tuning Script** (`lib/ai/fine-tune-grok.js`)
   - Uploads training data to Grok API
   - Creates fine-tune job automatically
   - Monitors progress and logs status
   - Saves model ID when complete

3. **Model Configuration** (`lib/ai/fine-tuned-model.ts`)
   - Stores fine-tuned model ID
   - Tracks training status
   - Auto-loaded by chat endpoint

4. **Chat Integration** (`lib/chat/llm-provider.ts`)
   - Automatically detects fine-tuned model
   - Falls back to default if not available
   - Logs which model is active

## 🚀 How to Train (3 Steps)

### Step 1: Set API Key
```bash
export GROK_API_KEY="your-xai-api-key"
```

Get your key: https://console.x.ai/api/keys

### Step 2: Run Training
```bash
npm run train:grok
```

Or manually:
```bash
node lib/ai/fine-tune-grok.js
```

### Step 3: Monitor Progress
The script will:
- ✅ Upload training data
- ✅ Create fine-tune job
- ⏳ Wait for completion (10-60 minutes)
- ✅ Save model ID automatically

### Step 4: Verify
```bash
# Restart your dev server
npm run dev

# Test in chat:
# Message: "hunza best time to visit"
# Should reflect training examples
```

Check server logs for:
```
[Grok] Using fine-tuned model: ft-grok-2-xxxxx
```

## 📊 Training Data Summary

| Category | Examples | Topics |
|----------|----------|--------|
| Destinations | 6 | Hunza, Skardu, Lahore, Islamabad, Fairy Meadows |
| Bookings | 4 | How to book, cancellations, payment verification |
| Travel Advice | 6 | Packing, best time, safety, activities |
| Guides | 2 | Finding guides, guide recommendations |
| General | 2 | Who are you, tell me about yourself |

**Total Examples**: 20
**Total Tokens**: ~5,000
**Estimated Cost**: $0.15-$0.20

## 🔄 Iterative Training

Add more examples to improve quality:

1. **Monitor real usage**: Check chat logs for common questions
2. **Update training data**: Add new user-guide pairs to `training-data.jsonl`
3. **Re-train**: Run `npm run train:grok` again
4. **Deploy**: New model used automatically

Example: If users frequently ask about "K2 base camp", add:
```jsonl
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "k2 base camp trek"}, {"role": "assistant", "content": "K2 base camp is one of the most challenging high-altitude treks..."}]}
```

## 📋 Training Data Format

Each line must be valid JSON with this structure:
```json
{
  "messages": [
    {"role": "system", "content": "You are TrailMate..."},
    {"role": "user", "content": "user query"},
    {"role": "assistant", "content": "assistant response"}
  ]
}
```

- **system**: Core instructions (keep consistent across all examples)
- **user**: User's question or request
- **assistant**: Ideal response the model should learn

## 🧪 Testing the Model

### Local Test
```bash
# In Node.js REPL
import { generateContextualTravelResponse } from '@/lib/chat/llm-provider'

const response = await generateContextualTravelResponse(
  "hunza best time",
  [],
  "traveler"
)
console.log(response)
```

### Chat API Test
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -b "access_token=your-token" \
  -d '{"message": "hunza"}'
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "No API key found" | Run: `export GROK_API_KEY="your-key"` |
| "File not found" | Verify: `ls lib/ai/training-data.jsonl` |
| "Model not detected" | Restart server: `npm run dev` |
| "Fine-tune failed" | Check training data JSON format |
| "Training taking long" | Normal! Can take 10-60 minutes |

## 📚 Advanced Options

### Change Training Hyperparameters
Edit `lib/ai/fine-tune-grok.js`:
```javascript
hyperparameters: {
  n_epochs: 4,           // More training (slower, more accurate)
  learning_rate_multiplier: 1.5, // Stronger learning
}
```

### Use Different Grok Model
```javascript
model: 'grok-4.20-reasoning' // or other variants
```

### Track Model Performance
After deployment, monitor:
- Chat response quality
- User satisfaction (if rating enabled)
- Common follow-up questions
- Model fallback frequency

## 📖 Documentation

- Full guide: [AI_TRAINING_GUIDE.md](AI_TRAINING_GUIDE.md)
- Chat API: [AI_CHATBOT_IMPLEMENTATION_GUIDE.md](AI_CHATBOT_IMPLEMENTATION_GUIDE.md)
- Guide matching: [QUICK_START_CHATBOT_MATCHING.md](QUICK_START_CHATBOT_MATCHING.md)

## 🎓 Next Steps

1. ✅ Run `npm run train:grok` to fine-tune the model
2. ✅ Monitor progress (takes 10-60 minutes)
3. ✅ Restart dev server when complete
4. ✅ Test chat responses
5. ✅ Add more training examples as needed
6. ✅ Monitor production usage and iterate

## 💾 Files Reference

```
lib/ai/
  ├── training-data.jsonl          # Training examples (20+)
  ├── fine-tune-grok.js            # Training script
  ├── fine-tuned-model.ts          # Model config storage
  └── README.md                     # This file

lib/chat/
  └── llm-provider.ts              # Auto-loads fine-tuned model

package.json                        # "train:grok" script
```

## 🎯 Success Criteria

✅ Script runs without errors
✅ Model ID is generated and saved
✅ Chat endpoint detects and uses fine-tuned model
✅ Responses follow training patterns
✅ Chat quality improves with targeted examples

---

**Ready to train?** Run: `npm run train:grok`

**Need help?** See [AI_TRAINING_GUIDE.md](AI_TRAINING_GUIDE.md) for full documentation.
