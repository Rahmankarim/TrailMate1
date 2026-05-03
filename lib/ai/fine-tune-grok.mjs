#!/usr/bin/env node

/**
 * TrailMate AI Fine-tuning Script for Grok
 *
 * This script fine-tunes the Grok model using the TrailMate training dataset.
 *
 * Prerequisites:
 * - Set GROK_API_KEY or XAI_API_KEY environment variable
 * - Run: node lib/ai/fine-tune-grok.mjs
 *
 * Output:
 * - Prints the fine-tuned model ID (save this for deployment)
 * - Updates lib/ai/fine-tuned-model.json with the model ID
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(projectRoot, '.env.local'))
loadEnvFile(path.join(projectRoot, '.env'))
loadEnvFile(path.join(projectRoot, '.env.production'))

const API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY
const BASE_URL = process.env.GROK_BASE_URL || 'https://api.x.ai/v1'
const TRAINING_DATA_FILE = path.join(__dirname, 'training-data.jsonl')
const OUTPUT_FILE = path.join(__dirname, 'fine-tuned-model.json')
const SUMMARY_FILE = path.join(__dirname, 'training-summary.json')

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function uploadTrainingFile() {
  console.log('📤 Uploading training data...')

  if (!fs.existsSync(TRAINING_DATA_FILE)) {
    throw new Error(`Training file not found: ${TRAINING_DATA_FILE}`)
  }

  const formData = new FormData()
  const fileStream = fs.readFileSync(TRAINING_DATA_FILE)
  const blob = new Blob([fileStream], { type: 'application/x-jsonl' })
  formData.append('file', blob, 'training-data.jsonl')
  formData.append('purpose', 'fine-tune')

  const response = await fetch(`${BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload training file: ${response.status} ${error}`)
  }

  const data = await response.json()
  console.log(`✅ File uploaded: ${data.id}`)
  return data.id
}

async function createFineTune(fileId) {
  console.log('🎯 Creating fine-tune job...')

  const response = await fetch(`${BASE_URL}/fine_tuning/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      training_file: fileId,
      model: 'grok-2-latest',
      suffix: 'trailmate-travel-assistant',
      hyperparameters: {
        n_epochs: 3,
        learning_rate_multiplier: 1.0,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    const err = new Error(`Failed to create fine-tune job: ${response.status} ${error}`)
    err.statusCode = response.status
    throw err
  }

  const data = await response.json()
  console.log(`✅ Fine-tune job created: ${data.id}`)
  return data.id
}

function buildLocalKnowledgeBoost() {
  const raw = fs.readFileSync(TRAINING_DATA_FILE, 'utf8')
  const lines = raw.split(/\r?\n/).filter(Boolean)
  const examples = []

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      const userMessage = parsed?.messages?.find((message) => message.role === 'user')?.content || ''
      const assistantMessage = parsed?.messages?.find((message) => message.role === 'assistant')?.content || ''
      if (userMessage && assistantMessage) {
        examples.push({ userMessage, assistantMessage })
      }
    } catch {
      // Ignore malformed lines and continue.
    }
  }

  const output = {
    mode: 'local-rag',
    status: 'ready',
    examplesCount: examples.length,
    trainingFile: path.basename(TRAINING_DATA_FILE),
    timestamp: new Date().toISOString(),
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify({ examples, createdAt: output.timestamp }, null, 2))

  console.log('✅ Grok fine-tuning endpoint is unavailable in this xAI environment.')
  console.log('✅ Built a local knowledge boost from the training data instead.')
  console.log(`📝 Saved summary to: ${SUMMARY_FILE}`)
  console.log(`📝 Saved status to: ${OUTPUT_FILE}`)
  console.log('🎉 Success! The chatbot will use the curated TrailMate examples as fallback context.')
}

async function waitForFineTune(jobId) {
  console.log('⏳ Waiting for fine-tune to complete...')
  console.log('   (This may take 10-60 minutes)')

  let completed = false
  let modelId = null

  while (!completed) {
    const response = await fetch(`${BASE_URL}/fine_tuning/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to check fine-tune status: ${response.status}`)
    }

    const data = await response.json()
    const status = data.status
    const progress = data.trained_tokens || 0
    const totalTokens = data.training_file?.size || 'unknown'

    console.log(`   Status: ${status} | Progress: ${progress}/${totalTokens} tokens`)

    if (status === 'succeeded') {
      completed = true
      modelId = data.fine_tuned_model
      console.log(`✅ Fine-tune completed! Model ID: ${modelId}`)
    } else if (status === 'failed') {
      throw new Error(`Fine-tune failed: ${data.error?.message || 'Unknown error'}`)
    } else if (status === 'cancelled') {
      throw new Error('Fine-tune was cancelled')
    }

    if (!completed) {
      await delay(30000)
    }
  }

  return modelId
}

async function main() {
  try {
    console.log('🚀 TrailMate AI Fine-tuning for Grok')
    console.log('=====================================\n')

    if (!API_KEY) {
      throw new Error('GROK_API_KEY or XAI_API_KEY environment variable not set')
    }

    const fileId = await uploadTrainingFile()

    try {
      const jobId = await createFineTune(fileId)
      const modelId = await waitForFineTune(jobId)

      const output = {
        modelId,
        timestamp: new Date().toISOString(),
        status: 'ready',
        mode: 'fine-tuned',
      }

      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))
      console.log(`\n📝 Model ID saved to: ${OUTPUT_FILE}`)
      console.log(`\n🎉 Success! Use model ID in your chat endpoint:`)
      console.log(`   ${modelId}`)
      console.log(`\nUpdate lib/chat/llm-provider.ts with this model ID.`)
    } catch (error) {
      if (error?.statusCode === 404) {
        buildLocalKnowledgeBoost()
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main()
