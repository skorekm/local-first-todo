import { todoCollection } from "../collections/todoCollection"
import type { TodoList } from "../components/TodoApp"

export const todoService = {
  postTodo: async (todoList: TodoList) => {
    try {
      await todoCollection.insert(todoList)
    } catch (error) {
      console.error('Failed to add new todo:', error)
    }
  }
}