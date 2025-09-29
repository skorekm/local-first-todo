import { createCollection } from '@tanstack/react-db'
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection'

// Import your RxDB database
import { db } from './todoRxdb'


export const todoCollection = createCollection(
  rxdbCollectionOptions({
    rxCollection: db.todos,
    startSync: true,
  })
)
