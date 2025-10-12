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
    handler: async (lastPulledCheckpoint: { timestamp: number } | undefined) => {
      // Extract timestamp from checkpoint, or use 0 for initial sync
      const since = lastPulledCheckpoint?.timestamp || 0
      console.log('Pull handler: Fetching changes since', since)
      
      try {
        // Delta sync: only fetch documents changed since last checkpoint
        const response = await fetch(`/api/todos?since=${since}`)
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }
        
        const data = await response.json()
        
        console.log('Pull: Raw server response:', JSON.stringify(data, null, 2))
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid server response: expected object')
        }
        
        if (!Array.isArray(data.documents)) {
          console.error('Invalid response data:', data)
          console.error('Type of data.documents:', typeof data.documents)
          throw new Error('Invalid server response: documents must be an array')
        }
        
        if (typeof data.checkpoint !== 'number') {
          console.error('Invalid checkpoint:', data.checkpoint)
          throw new Error('Invalid server response: checkpoint must be a number')
        }
        
        console.log(`Pull: Received ${data.documents.length} changed documents (checkpoint: ${data.checkpoint})`)
        
        // Convert server data to match RxDB schema
        const documents = data.documents.map((item: TodoList) => ({
          id: item.id.toString(),
          name: item.name,
          todos: item.todos.map(todo => ({
            id: todo.id.toString(),
            text: todo.text,
            completed: todo.completed
          }))
        }))
        
        // Return documents and the server's checkpoint
        return {
          documents,
          checkpoint: { timestamp: data.checkpoint }
        }
      } catch (error) {
        console.log('Pull handler error (will retry):', error)
        throw error
      }
    }
  },
  push: {
    handler: async (docs) => {
      console.log('Push handler: Processing', docs.length, 'operations')
      
      // Log what operations we're performing (for debugging)
      docs.forEach(row => {
        const isInsert = !row.assumedMasterState
        const isDelete = row.newDocumentState._deleted
        
        let operationType = 'UPDATE'
        if (isInsert) operationType = 'INSERT'
        if (isDelete) operationType = 'DELETE'
        
        console.log(`  ${operationType}: ${row.newDocumentState.id} - ${row.newDocumentState.name}`)
      })
      
      // Extract the actual documents from the push rows
      const documentsToSend = docs.map(row => row.newDocumentState)
      
      try {
        // Send all operations in a batch to the server
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(documentsToSend)
        })
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }
        
        const result = await response.json()
        console.log('Push: Successfully synced', result.length, 'operations')
        
        // Return empty array (no conflicts) - RxDB expects this format
        return []
      } catch (error) {
        console.log('Push handler error (will retry):', error)
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