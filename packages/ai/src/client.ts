import { openai } from '@ai-sdk/openai'

// OPENAI_API_KEY is picked up automatically from the environment
export const fastModel = openai('gpt-4o-mini')
