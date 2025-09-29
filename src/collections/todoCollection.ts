import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

const todoSchema = z.object({
  id: z.number(),
  name: z.string(),
  todos: z.array(z.object({
    id: z.number(),
    text: z.string(),
    completed: z.boolean(),
  })),
})

const queryClient = new QueryClient()

export const todoCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos')
      const data = await response.json()
      return data
    },
    getKey: (item) => item?.id,
    schema: todoSchema,
    onInsert: async ({ transaction}) => {
      const { modified: newList } = transaction.mutations[0];
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newList),
      })
      return response.json()
    },
  })
)
