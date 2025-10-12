import { useState } from 'react'
import type { TodoList } from './TodoApp'
import { todoService } from '../services/todoService'
import { db } from '../collections/todoRxdb'

interface TodoListSidebarProps {
  todoLists: TodoList[]
  selectedListId: string
  onSelectList: (listId: string) => void
}

export function TodoListSidebar({ 
  todoLists, 
  selectedListId, 
  onSelectList 
}: TodoListSidebarProps) {
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState('')

  const handleAddList = async () => {
    if (newListName.trim()) {
      const newList = {
        id: (todoLists.length + 1).toString(), // Convert to string
        name: newListName.trim(),
        todos: []
      }
      try {
        await todoService.postTodo(newList)
        setNewListName('')
        setIsAddingList(false)
      } catch (error) {
        console.error('Failed to add new list:', error)
      }
    }
  }

  const handleRemoveList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering list selection
    
    if (window.confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      try {
        const doc = await db.todos.findOne(listId).exec()
        if (doc) {
          await doc.remove()
          // If the deleted list was selected, clear the selection
          if (selectedListId === listId) {
            onSelectList('')
          }
        }
      } catch (error) {
        console.error('Failed to remove list:', error)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddList()
    } else if (e.key === 'Escape') {
      setIsAddingList(false)
      setNewListName('')
    }
  }

  return (
    <div className="w-80 bg-bg-secondary border-r border-gray-200 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Todo Lists</h1>
        <p className="text-gray-600 text-sm">Choose a list to view your todos</p>
      </div>

      <div className="space-y-3">
        {todoLists.map((list) => (
          <div
            key={list.id}
            className={`
              relative w-full text-left p-4 rounded-xl transition-all duration-200 cursor-pointer group
              ${selectedListId === String(list.id) 
                ? 'ring-2 ring-gray-400 shadow-lg scale-105' 
                : 'hover:shadow-md hover:scale-102'
              }
            `}
            onClick={() => onSelectList(String(list.id))}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">{list.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {list.todos.length} {list.todos.length === 1 ? 'task' : 'tasks'}
                </span>
                <button
                  onClick={(e) => handleRemoveList(list.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                  aria-label="Delete list"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddingList ? (
        <div className="mt-6 p-4 border-2 border-gray-300 rounded-xl bg-white">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter list name..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAddList}
              disabled={!newListName.trim()}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingList(false)
                setNewListName('')
              }}
              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsAddingList(true)}
          className="w-full mt-6 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">+</span>
            <span>Add New List</span>
          </div>
        </button>
      )}
    </div>
  )
}
