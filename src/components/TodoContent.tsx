import { useState } from 'react'
import type { TodoList, Todo } from './TodoApp'
import { db } from '../collections/todoRxdb'

interface TodoContentProps {
  selectedList?: TodoList
  todos: Todo[]
}

export function TodoContent({ selectedList, todos }: TodoContentProps) {
  const [newTodoText, setNewTodoText] = useState('')

  const handleAddTodo = async () => {
    if (!selectedList || !newTodoText.trim()) return

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: newTodoText.trim(),
      completed: false
    }

    try {
      const doc = await db.todos.findOne(selectedList.id).exec()
      if (doc) {
        await doc.incrementalModify((oldData: TodoList) => {
          oldData.todos.push(newTodo)
          return oldData
        })
        setNewTodoText('')
      }
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  }

  const handleToggleTodo = async (todoId: string) => {
    if (!selectedList) return

    try {
      const doc = await db.todos.findOne(selectedList.id).exec()
      if (doc) {
        await doc.incrementalModify((oldData: TodoList) => {
          const todo = oldData.todos.find(t => t.id === todoId)
          if (todo) {
            todo.completed = !todo.completed
          }
          return oldData
        })
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  const handleRemoveTodo = async (todoId: string) => {
    if (!selectedList) return

    try {
      const doc = await db.todos.findOne(selectedList.id).exec()
      if (doc) {
        await doc.incrementalModify((oldData: TodoList) => {
          oldData.todos = oldData.todos.filter(t => t.id !== todoId)
          return oldData
        })
      }
    } catch (error) {
      console.error('Failed to remove todo:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTodo()
    }
  }

  if (!selectedList) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold mb-2">Select a Todo List</h2>
          <p>Choose a list from the sidebar to view your todos</p>
        </div>
      </div>
    )
  }

  const completedCount = todos.filter(todo => todo.completed).length
  const totalCount = todos.length

  return (
    <div className={`flex-1 bg-gradient-to-br p-8`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedList.name}</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{totalCount} total tasks</span>
          <span>•</span>
          <span>{completedCount} completed</span>
          <span>•</span>
          <span>{totalCount - completedCount} remaining</span>
        </div>
      </div>

      {/* Add new todo */}
      <div className="mb-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
            <input
              type="text"
              placeholder="Add a new todo..."
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              onClick={handleAddTodo}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newTodoText.trim()}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">No todos yet</h3>
            <p>Add your first todo to get started!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/70 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggleTodo(todo.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    todo.completed
                      ? 'bg-green-400 border-green-400 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {todo.completed && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 ${
                    todo.completed
                      ? 'text-gray-500 line-through'
                      : 'text-gray-800'
                  }`}
                >
                  {todo.text}
                </span>
                <button 
                  onClick={() => handleRemoveTodo(todo.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
