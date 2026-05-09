# TrailMate AI Training Guide (Grok Fine-tuning)

## Overview

This guide explains how to fine-tune the Grok model for the TrailMate chatbot using your API key.

## Quick Start

### 1. Prerequisites

- **API Key**: Get your Grok API key from [Grok API Console](https://api.x.ai)
- **Environment Setup**: Set your API key as an environment variable

### 2. Set Your API Key

```bash
# On macOS/Linux
export GROK_API_KEY="your-api-key-here"

# On Windows (Command Prompt)
set GROK_API_KEY=your-api-key-here

# On Windows (PowerShell)
$env:GROK_API_KEY="your-api-key-here"
```

### 3. Run Fine-tuning

```bash
# Make the script executable (macOS/Linux only)
chmod +x lib/ai/fine-tune-grok.js

# Run the fine-tuning script
node lib/ai/fine-tune-grok.js
```

### 4. Monitor Progress

The script will:

- Upload your training data to Grok
- Start a fine-tuning job
- Poll for completion (this typically takes 10-60 minutes)
- Display the fine-tuned model ID when complete

Example output:

```
🚀 TrailMate AI Fine-tuning for Grok
=====================================

📤 Uploading training data...
✅ File uploaded: file-xxxxx

🎯 Creating fine-tune job...
✅ Fine-tune job created: ftjob-xxxxx

⏳ Waiting for fine-tune to complete...
   Status: queued | Progress: 0/5000 tokens
   Status: in_progress | Progress: 2500/5000 tokens
   Status: in_progress | Progress: 5000/5000 tokens
✅ Fine-tune completed! Model ID: ft-grok-2-xxxxx

📝 Model ID saved to: lib/ai/fine-tuned-model.json

🎉 Success! Use model ID in your chat endpoint:
   ft-grok-2-xxxxx
```

## Training Data Structure

Training data is stored in `lib/ai/training-data.jsonl` in the following format:

```jsonl
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
...
```

Each line is a complete conversation that teaches the model how to respond to user queries.

## Customizing Training Data

To add more training examples:

1. Edit `lib/ai/training-data.jsonl`
2. Add new lines in the format shown above
3. Re-run the fine-tuning script
4. The new model will be automatically used in production

### Example: Adding a New Training Example

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are TrailMate, a helpful Pakistan travel assistant..."
    },
    {
      "role": "user",
      "content": "best trekking routes in hunza"
    },
    {
      "role": "assistant",
      "content": "Popular routes: Eagle's Nest, Rakaposhi Base Camp, and Attabad Lake Circuit. Each offers unique views..."
    }
  ]
}
```

## Advanced Configuration

### Fine-tuning Hyperparameters

Edit these in `lib/ai/fine-tune-grok.js`:

```javascript
hyperparameters: {
  n_epochs: 3,           // Number of training epochs (1-4 recommended)
  learning_rate_multiplier: 1.0, // Learning rate scale (0.5-2.0)
}
```

### Using a Different Model

Change the model in the script:

```javascript
body: JSON.stringify({
  training_file: fileId,
  model: "grok-4.20-reasoning", // or other Grok models
  // ...
});
```

## Deployment

### 1. Update Fine-tuned Model Config

After fine-tuning completes, the model ID is saved in `lib/ai/fine-tuned-model.ts`.

### 2. Automatic Usage

The chatbot automatically detects and uses the fine-tuned model if:

- Model file exists and is valid
- Status is "ready"

The LLM provider logs:

```
[Grok] Using fine-tuned model: ft-grok-2-xxxxx
```

### 3. Manual Override

To force using the default model, temporarily rename the fine-tuned model file or set status to "inactive".

## Monitoring and Validation

### Check Model Status

```javascript
// In your chat endpoint or validation script
import { fineTunedModelConfig } from "@/lib/ai/fine-tuned-model";

console.log(fineTunedModelConfig);
// Output: { modelId: "ft-grok-2-xxxxx", timestamp: "2025-01-15...", status: "ready" }
```

### Test the Fine-tuned Model

Send test messages through the chat API:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -b "access_token=your-jwt-token" \
  -d '{"message": "hunza best time to visit"}'
```

Expected response should reflect training data patterns.

## Troubleshooting

### "API key not found"

- Verify API key is set: `echo $GROK_API_KEY`
- Try in a new terminal window after setting the variable

### "File upload failed"

- Check file size: `wc -l lib/ai/training-data.jsonl`
- Verify JSONL format: Each line must be valid JSON

### "Fine-tune job failed"

- Check error message in terminal output
- Review training data for format issues
- Verify API key has fine-tuning permissions

### "Fine-tuned model not being used"

- Check `lib/ai/fine-tuned-model.ts` exists and is valid JSON
- Verify `status: "ready"` in the config
- Check server logs for `[Grok] Using fine-tuned model:` message
- Restart the Next.js server if recently trained

## Best Practices

1. **Start with quality data**: Ensure training examples are representative of actual usage
2. **Balance examples**: Include diverse user intents and destinations
3. **Monitor quality**: Test chat responses after deployment
4. **Iterate**: Add more examples based on real user conversations
5. **Document changes**: Note when models are fine-tuned and what data was added
6. **Version control**: Keep track of which model IDs correspond to which training dates

## Extending Training Data

To expand the model's knowledge base:

1. **Gather real conversations**: Monitor chat interactions and add successful patterns
2. **Add role-specific examples**: Include guide, company, admin assistant examples
3. **Seasonal updates**: Add new destination info as it changes
4. **Multilingual support**: Add Urdu/Pashto examples for local guides
5. **Complex scenarios**: Add examples of multi-step booking and payment flows

Example workflow:

```bash
# 1. Update training data
vi lib/ai/training-data.jsonl

# 2. Run fine-tuning
node lib/ai/fine-tune-grok.js

# 3. Test the updated model
npm run dev

# 4. Validate in browser
# Visit /dashboard/guide and test chat
```

## Cost Estimation

- **File upload**: Free
- **Fine-tuning**: $0.03 per 1M tokens (approximately)
- **Inference**: Standard Grok pricing applies to responses

Training 20-30 examples (≈5000 tokens) costs roughly $0.15-$0.20.

## Support

For issues:

1. Check Grok API documentation: https://console.x.ai/docs
2. Review fine-tuning logs in terminal output
3. Check `lib/ai/fine-tuned-model.ts` for model configuration
4. Validate training data format with JSONL validator

---

**Last Updated**: January 2025
**Status**: Production Ready
