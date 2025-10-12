import express from 'express'

const app = express()

// Parse JSON regardless of Content-Type (frontend isn't sending headers yet)
app.use(express.json({ strict: false, type: () => true }))

// Store documents with timestamps for delta sync
const mockTodos = [
  {
    id: 1, 
    name: 'Shopping', 
    todos: [
      { id: 1, text: 'Buy groceries', completed: false },
      { id: 2, text: 'Walk the dog', completed: true },
      { id: 3, text: 'Read a book', completed: false },
    ],
    updatedAt: Date.now() - 10000, // 10 seconds ago
  },
  {
    id: 2,
    name: 'Work',
    todos: [
      { id: 4, text: 'Finish project proposal', completed: false },
      { id: 5, text: 'Review code', completed: true },
      { id: 6, text: 'Team meeting at 3pm', completed: false },
    ],
    updatedAt: Date.now() - 20000, // 20 seconds ago
  },
  {
    id: 3, 
    name: 'Personal', 
    todos: [
      { id: 7, text: 'Milk', completed: true },
      { id: 8, text: 'Bread', completed: false },
      { id: 9, text: 'Apples', completed: false },
    ],
    updatedAt: Date.now() - 30000, // 30 seconds ago
  },
  {
    id: 4, 
    name: 'Other', 
    todos: [
      { id: 10, text: 'Learn TanStack Router', completed: false },
      { id: 11, text: 'Build todo app', completed: false },
    ],
    updatedAt: Date.now() - 40000, // 40 seconds ago
  },
]

// GET /api/todos - supports delta sync with ?since=timestamp
app.get('/api/todos', (req, res) => {
  try {
    const since = req.query.since ? parseInt(req.query.since) : 0
    
    // Ensure all documents have updatedAt timestamp
    mockTodos.forEach(todo => {
      if (!todo.updatedAt) {
        todo.updatedAt = Date.now()
      }
    })
    
    // Filter documents changed since the checkpoint
    const changedDocs = mockTodos.filter(todo => todo.updatedAt > since)
    
    // Calculate the latest timestamp for the checkpoint
    const latestTimestamp = mockTodos.length > 0 
      ? Math.max(...mockTodos.map(t => t.updatedAt))
      : Date.now()
    
    console.log(`Delta sync: returning ${changedDocs.length} docs changed since ${since}`)
    
    res.json({
      documents: changedDocs,
      checkpoint: latestTimestamp
    })
  } catch (error) {
    console.error('Error in GET /api/todos:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/todos - handles batch operations from RxDB
app.post('/api/todos', (req, res) => {
  const body = req.body ?? {}
  
  // Check if it's an array (from RxDB push)
  if (Array.isArray(body)) {
    const results = body.map(item => {
      const id = item.id.toString()
      const timestamp = Date.now()
      
      // Handle deletions - RxDB marks deleted documents with _deleted: true
      if (item._deleted) {
        const idx = mockTodos.findIndex(t => t.id.toString() === id)
        if (idx !== -1) {
          mockTodos.splice(idx, 1)
          console.log(`DELETE: Removed todo list ${id}`)
        }
        return { id, _deleted: true }
      }
      
      // Handle updates or inserts
      const existingIdx = mockTodos.findIndex(t => t.id.toString() === id)
      const todoList = {
        id,
        name: item.name || '',
        todos: item.todos || [],
        updatedAt: timestamp,
      }
      
      if (existingIdx !== -1) {
        // Update existing
        mockTodos[existingIdx] = todoList
        console.log(`UPDATE: Updated todo list ${id} - ${todoList.name}`)
      } else {
        // Insert new
        mockTodos.push(todoList)
        console.log(`INSERT: Created new todo list ${id} - ${todoList.name}`)
      }
      
      return todoList
    })
    res.status(201).json(results)
  } else {
    // Handle single document (existing logic)
    const id = Number.isFinite(body.id) ? Number(body.id) : Object.keys(mockTodos).length + 1
    const newList = {
      id,
      name: typeof body.name === 'string' ? body.name : '',
      todos: [],
      updatedAt: Date.now(),
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

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})