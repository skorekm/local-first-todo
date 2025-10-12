import { createRxDatabase, addRxPlugin } from 'rxdb/plugins/core'

import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage'

import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

// Enable dev mode (optional, recommended during development)
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
addRxPlugin(RxDBDevModePlugin)

import { replicateRxCollection } from 'rxdb/plugins/replication'
import type { TodoList } from '../components/TodoApp';


export const db = await createRxDatabase({
  name: 'my-todos',
  storage: wrappedValidateAjvStorage({
    storage: getRxStorageLocalstorage()
  })
})

await db.addCollections({
  todos: {
    schema: {
      title: 'todos',
      version: 0,
      type: 'object',
      primaryKey: 'id',
      properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        todos: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', maxLength: 100 }, text: { type: 'string' }, completed: { type: 'boolean' } } } },
      },
      required: ['id', 'name', 'todos'],
    },
  },
})



export const replicationState = replicateRxCollection({
  collection: db.todos,
  replicationIdentifier: 'todos',
  pull: {
    handler: async (lastPulledCheckpoint) => {
      console.log('Pull handler called with checkpoint:', lastPulledCheckpoint)
      
      try {
        const response = await fetch('/api/todos')
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }
        
        const data = await response.json()
        
        console.log('Server data:', data)
        
        // Convert server data to match RxDB schema
        const documents = data.map((item: TodoList) => ({
          id: item.id.toString(),
          name: item.name,
          todos: item.todos.map(todo => ({
            id: todo.id.toString(),
            text: todo.text,
            completed: todo.completed
          }))
        }))
        
        console.log('Converted documents:', documents)
        
        // Return in the format RxDB expects
        return {
          documents,
          checkpoint: { timestamp: Date.now() }
        }
      } catch (error) {
        console.log('Pull handler error (will retry):', error)
        // Re-throw the error so RxDB knows to retry
        throw error
      }
    }
  },
  push: {
    handler: async (docs) => {
      console.log('Push handler called with docs:', docs)
      
      // Extract the actual documents from the push rows
      const documentsToSend = docs.map(row => row.newDocumentState)
      
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(documentsToSend)
        })
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }
        
        const result = await response.json()
        console.log('Server response:', result)
        
        // Return empty array (no conflicts) - RxDB expects this format
        return []
      } catch (error) {
        console.log('Push handler error (will retry):', error)
        // Re-throw the error so RxDB knows to retry
        throw error
      }
    }
  },
  live: true,
  retryTime: 5000
})

// Add error handling
replicationState.error$.subscribe(error => {
  // Network errors are expected when offline, just log them quietly
  const errorStr = JSON.stringify(error)
  if (errorStr.includes('Failed to fetch')) {
    console.log('Sync temporarily unavailable (offline or server unreachable)')
  } else {
    console.error('Replication error:', error)
  }
})

replicationState.active$.subscribe(active => {
  console.log('Replication active:', active)
})

// Log when sync is successful
replicationState.received$.subscribe(doc => {
  console.log('Synced from server:', doc)
})

replicationState.sent$.subscribe(doc => {
  console.log('Synced to server:', doc)
})