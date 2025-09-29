import express from 'express'

const app = express()

// Parse JSON regardless of Content-Type (frontend isn’t sending headers yet)
app.use(express.json({ strict: false, type: () => true }))

const mockTodos = [
  {
    id: 1, name: 'Shopping', todos: [
      { id: 1, text: 'Buy groceries', completed: false },
      { id: 2, text: 'Walk the dog', completed: true },
      { id: 3, text: 'Read a book', completed: false },
    ],
  },
  {
    id: 2,
    name: 'Work',
    todos: [
      { id: 4, text: 'Finish project proposal', completed: false },
      { id: 5, text: 'Review code', completed: true },
      { id: 6, text: 'Team meeting at 3pm', completed: false },
    ],
  },
  {
    id: 3, name: 'Personal', todos: [
      { id: 7, text: 'Milk', completed: true },
      { id: 8, text: 'Bread', completed: false },
      { id: 9, text: 'Apples', completed: false },
    ]
  },
  {
    id: 4, name: 'Other', todos: [
      { id: 10, text: 'Learn TanStack Router', completed: false },
      { id: 11, text: 'Build todo app', completed: false },
    ]
  },

]

app.get('/api/todos', (req, res) => {
  res.json(mockTodos)
})

app.post('/api/todos', (req, res) => {
  const body = req.body ?? {}
  
  // Check if it's an array (from RxDB push)
  if (Array.isArray(body)) {
    const results = body.map(item => {
      const id = item.id || (mockTodos.length + 1).toString()
      const newList = {
        id,
        name: item.name || '',
        todos: item.todos || [],
      }
      mockTodos.push(newList)
      return newList
    })
    res.status(201).json(results)
  } else {
    // Handle single document (existing logic)
    const id = Number.isFinite(body.id) ? Number(body.id) : Object.keys(mockTodos).length + 1
    const newList = {
      id,
      name: typeof body.name === 'string' ? body.name : '',
      todos: [],
    }
    if (!mockTodos[id]) {
      mockTodos[id - 1] = newList
    }
    res.status(201).json(newList)
  }
})

app.put('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  const idx = mockTodos[id].findIndex(t => t.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const body = req.body ?? {}
  mockTodos[id][idx] = { ...mockTodos[id][idx], ...body, id }
  res.json(mockTodos[id][idx])
})

app.delete('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  const idx = mockTodos[id].findIndex(t => t.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const [removed] = mockTodos[id].splice(idx, 1)
  res.json(removed)
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})