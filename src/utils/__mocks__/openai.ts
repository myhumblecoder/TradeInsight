import { vi } from 'vitest'

const mockCreate = vi.fn()

const OpenAI = vi.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
}))

export default OpenAI
export { mockCreate }
