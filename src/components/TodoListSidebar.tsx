import { useState } from 'react'
import type { TodoList } from './TodoApp'
import { todoCollection } from '../collections/todoCollection'

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
        id: todoLists.length + 1,
        name: newListName.trim(),
        todos: []
      }
      try {
        await todoCollection.insert(newList)
        setNewListName('')
        setIsAddingList(false)
      } catch (error) {
        console.error('Failed to add new list:', error)
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
          <button
            key={list.id}
            onClick={() => onSelectList(String(list.id))}
            className={`
              w-full text-left p-4 rounded-xl transition-all duration-200 
              ${selectedListId === String(list.id) 
                ? 'ring-2 ring-gray-400 shadow-lg scale-105' 
                : 'hover:shadow-md hover:scale-102'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">{list.name}</span>
              <div className="w-3 h-3 rounded-full bg-white/50"></div>
            </div>
          </button>
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
