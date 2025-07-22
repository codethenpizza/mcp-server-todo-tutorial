import { Task, FilterType } from '../types/mcp';

export class TaskService {
  private tasks: Task[] = [];

  addTask(task: Task): void {
    this.tasks.push(task);
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }

  getTasksByFilter(filter: FilterType): Task[] {
    switch (filter) {
      case 'pending':
        return this.tasks.filter(task => !task.completed);
      case 'completed':
        return this.tasks.filter(task => task.completed);
      case 'all':
      default:
        return this.tasks;
    }
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return null;
    }

    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
    return this.tasks[taskIndex];
  }

  deleteTask(id: string): Task | null {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return null;
    }

    const deletedTask = this.tasks.splice(taskIndex, 1)[0];
    return deletedTask;
  }

  clearAllTasks(): void {
    this.tasks = [];
  }

  getAllTasks(): Task[] {
    return this.tasks;
  }

  getTotalCount(): number {
    return this.tasks.length;
  }

  getAnalytics(): { total: number; completed: number; pending: number } {
    const completed = this.tasks.filter(task => task.completed).length;
    const pending = this.tasks.filter(task => !task.completed).length;
    
    return {
      total: this.tasks.length,
      completed,
      pending
    };
  }
}