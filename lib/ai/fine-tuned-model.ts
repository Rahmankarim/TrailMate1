/**
 * TrailMate AI Fine-tuning Configuration
 * 
 * This file stores the fine-tuned model ID after running fine-tune-grok.js
 * It's automatically updated by the fine-tuning script.
 * 
 * Structure:
 * - modelId: The fine-tuned Grok model ID (e.g., "ft-grok-2-xxxxx")
 * - timestamp: When the model was fine-tuned
 * - status: "ready", "training", "failed", or "not-trained"
 */

export const fineTunedModelConfig = {
  modelId: null, // Will be populated after fine-tuning
  timestamp: null,
  status: "not-trained", // States: "not-trained", "training", "ready", "failed"
}
