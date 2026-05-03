import fs from 'fs'
import path from 'path'

export type TrainingExample = {
  userMessage: string
  assistantMessage: string
}

const TRAINING_DATA_PATH = path.join(process.cwd(), 'lib', 'ai', 'training-data.jsonl')

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function overlapScore(queryTokens: Set<string>, candidate: string) {
  const candidateTokens = new Set(tokenize(candidate))
  let score = 0

  for (const token of candidateTokens) {
    if (queryTokens.has(token)) {
      score += token.length > 3 ? 2 : 1
    }
  }

  return score
}

export function loadTrainingExamples(): TrainingExample[] {
  if (!fs.existsSync(TRAINING_DATA_PATH)) return []

  const content = fs.readFileSync(TRAINING_DATA_PATH, 'utf8')
  const examples: TrainingExample[] = []

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    try {
      const parsed = JSON.parse(trimmed)
      const userMessage = parsed?.messages?.find((message: { role?: string; content?: string }) => message.role === 'user')?.content
      const assistantMessage = parsed?.messages?.find((message: { role?: string; content?: string }) => message.role === 'assistant')?.content

      if (typeof userMessage === 'string' && typeof assistantMessage === 'string') {
        examples.push({ userMessage, assistantMessage })
      }
    } catch {
      // Ignore malformed lines so one bad example does not break the assistant.
    }
  }

  return examples
}

export function getRelevantTrainingExamples(userMessage: string, limit = 3): TrainingExample[] {
  const examples = loadTrainingExamples()
  if (!examples.length || !userMessage.trim()) return []

  const queryTokens = new Set(tokenize(userMessage))

  return examples
    .map(example => ({
      example,
      score:
        overlapScore(queryTokens, example.userMessage) +
        overlapScore(queryTokens, example.assistantMessage),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(entry => entry.example)
}

export function buildTrainingContext(userMessage: string, limit = 3) {
  const examples = getRelevantTrainingExamples(userMessage, limit)
  if (!examples.length) return ''

  return examples
    .map((example, index) => {
      return [
        `Example ${index + 1}`,
        `User: ${example.userMessage}`,
        `Assistant: ${example.assistantMessage}`,
      ].join('\n')
    })
    .join('\n\n')
}
