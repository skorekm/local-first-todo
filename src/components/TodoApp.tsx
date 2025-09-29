import { useState } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { todoCollection } from '../collections/todoCollection';
import { TodoListSidebar } from './TodoListSidebar';
import { TodoContent } from './TodoContent';


export interface Todo {
  id: string
  text: string
  completed: boolean
}


export interface TodoList {
  id: string
  name: string
  todos: Todo[];
}

export default function TodoApp() {
  const [selectedListId, setSelectedListId] = useState<string>('')
  const { data: rawTodoLists = [], isLoading } = useLiveQuery((q) => q.from({todo: todoCollection}))
  const todoLists = rawTodoLists as TodoList[]
  const selectedList = todoLists.find((list) => list.id === selectedListId)
  const currentTodos = selectedList?.todos || []

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Left Sidebar - Todo Lists */}
      <TodoListSidebar
        todoLists={todoLists}
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
      />
      
      {/* Main Content - Current List's Todos */}
      <TodoContent
        selectedList={selectedList}
        todos={currentTodos}
      />
    </div>
  )
}
