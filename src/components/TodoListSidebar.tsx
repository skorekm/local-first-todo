import type { TodoList } from './TodoApp'

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

      <button className="w-full mt-6 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl">+</span>
          <span>Add New List</span>
        </div>
      </button>
    </div>
  )
}
