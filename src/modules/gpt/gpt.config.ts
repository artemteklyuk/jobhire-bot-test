export const ANTHROPIC_GPT_CONFIG = {
  model: 'claude-3-haiku-20240307',
  maxTokens: 1000, // Maximum length of Claude's responses in tokens
  temperature: 0, // 0-1 Higher generates more creative responses, lower produces more predictable responses
  system: `
    Answer in English only. 
    The text you write is for the hiring manager, so the text should contain nothing but the letter itself.
    Fill in the necessary data from the ones I've given you.
  `, // system prompt
} as const;

export const CHAT_GPT_CONFIG = {
  model: 'gpt-4o-mini', // model
  maxRetries: 3,
  system: `
    Answer in English only. 
    Don't insert template strings.
    The text you write is for the hiring manager, so the text should contain nothing but the letter itself.
    Fill in the necessary data from the ones I've given you.
    Don't use Markdown or other markup languages in your answer.
  `, // system prompt
} as const;
