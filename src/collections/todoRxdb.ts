import { createRxDatabase, addRxPlugin } from 'rxdb/plugins/core'

/**
 * Here we use the localstorage based storage for RxDB.
 * RxDB has a wide range of storages based on Dexie.js, IndexedDB, SQLite and more.
 */
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage'

// add json-schema validation (optional)
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
      
      const response = await fetch('/api/todos')
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
    }
  },
  push: {
    handler: async (docs) => {
      console.log('Push handler called with docs:', docs)
      
      // Extract the actual documents from the push rows
      const documentsToSend = docs.map(row => row.newDocumentState)
      
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentsToSend)
      })
      
      const result = await response.json()
      console.log('Server response:', result)
      
      // Return empty array (no conflicts) - RxDB expects this format
      return []
    }
  },
  live: true,
  retryTime: 5000
})

// Add error handling
replicationState.error$.subscribe(error => {
  console.error('Replication error:', error)
})

replicationState.active$.subscribe(active => {
  console.log('Replication active:', active)
})