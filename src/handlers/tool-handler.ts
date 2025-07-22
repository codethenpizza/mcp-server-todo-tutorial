import { v4 as uuidv4 } from 'uuid';
import { MCPValidator, MCPError } from '../utils/validator';
import { MCP_ERRORS } from '../core/constants';
import { logger } from '../utils/logger';
import { TaskService } from '../services/task-service';
import { MCPTool, Task, ToolResult, FilterType, AnalysisType } from '../types/mcp';

const toolDefinitions: MCPTool[] = [
  {
    name: 'create_task',
    description: 'Creates a new task in the todo list with user consent',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          minLength: 1,
          maxLength: 500,
          description: 'The text content of the task to create'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'get_tasks',
    description: 'Retrieves the current list of tasks with filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Filter tasks by status',
          enum: ['all', 'pending', 'completed']
        }
      },
      required: ['filter']
    }
  },
  {
    name: 'update_task',
    description: 'Updates a task completion status with validation using task ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
          description: 'The UUID of the task to update'
        },
        completed: {
          type: 'boolean',
          description: 'Whether the task is completed'
        }
      },
      required: ['id', 'completed']
    }
  },
  {
    name: 'complete_task_by_text',
    description: 'Marks a task as completed by searching for its text content (supports partial matching)',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          minLength: 1,
          maxLength: 500,
          description: 'The text content of the task to mark as completed (supports partial matching)'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'analyze_tasks',
    description: 'Analyzes the current todo list and provides insights',
    inputSchema: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          description: 'Type of analysis to perform',
          enum: ['summary', 'progress', 'suggestions']
        }
      },
      required: ['analysis_type']
    }
  },
  {
    name: 'delete_task',
    description: 'Deletes a task from the todo list',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
          description: 'The UUID of the task to delete'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'clear_all_tasks',
    description: 'Clears all tasks from the todo list',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
];

export class ToolHandler {
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    this.taskService = taskService;
  }

  static getToolDefinitions(): MCPTool[] {
    return toolDefinitions;
  }

  async executeTool(toolName: string, parameters: any): Promise<ToolResult> {
    logger.logToolExecution(toolName, parameters);

    try {
      const tool = toolDefinitions.find(t => t.name === toolName);
      if (!tool) {
        throw new MCPError({
          ...MCP_ERRORS.VALIDATION_ERROR,
          data: `Tool ${toolName} not found`
        });
      }

      MCPValidator.validateToolParameters(toolName, parameters);

      switch (toolName) {
        case 'create_task':
          return await this.createTask(parameters);
        case 'get_tasks':
          return await this.getTasks(parameters);
        case 'update_task':
          return await this.updateTask(parameters);
        case 'complete_task_by_text':
          return await this.completeTaskByText(parameters);
        case 'analyze_tasks':
          return await this.analyzeTasks(parameters);
        case 'delete_task':
          return await this.deleteTask(parameters);
        case 'clear_all_tasks':
          return await this.clearAllTasks(parameters);
        default:
          throw new MCPError({
            ...MCP_ERRORS.VALIDATION_ERROR,
            data: `Unknown tool: ${toolName}`
          });
      }
    } catch (error) {
      logger.logToolExecution(toolName, parameters, null, error);
      throw error;
    }
  }

  private async createTask(parameters: { text: string }): Promise<ToolResult> {
    const newTask: Task = {
      id: uuidv4(),
      text: parameters.text.trim(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.taskService.addTask(newTask);

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: `Task created successfully: "${newTask.text}"`
        }
      ]
    };

    logger.info('Task created', { task: newTask });
    return result;
  }

  private async getTasks(parameters: { filter: FilterType }): Promise<ToolResult> {
    const filteredTasks = this.taskService.getTasksByFilter(parameters.filter);

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: `Retrieved ${filteredTasks.length} tasks (filter: ${parameters.filter})`
        }
      ]
    };

    return result;
  }

  private async updateTask(parameters: { id: string; completed: boolean }): Promise<ToolResult> {
    const task = this.taskService.getTaskById(parameters.id);
    if (!task) {
      throw new MCPError({
        ...MCP_ERRORS.VALIDATION_ERROR,
        data: `Task with ID ${parameters.id} not found`
      });
    }

    const updatedTask = this.taskService.updateTask(parameters.id, {
      completed: parameters.completed,
      updatedAt: new Date()
    });

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: `Task "${updatedTask!.text}" ${parameters.completed ? 'completed' : 'marked as pending'}`
        }
      ]
    };

    logger.info('Task updated', { task: updatedTask });
    return result;
  }

  private async completeTaskByText(parameters: { text: string }): Promise<ToolResult> {
    const searchText = parameters.text.toLowerCase().trim();
    const allTasks = this.taskService.getAllTasks();
    
    // Find tasks that match the search text (case-insensitive partial matching)
    const matchingTasks = allTasks.filter(task => 
      task.text.toLowerCase().includes(searchText) && !task.completed
    );

    if (matchingTasks.length === 0) {
      throw new MCPError({
        ...MCP_ERRORS.VALIDATION_ERROR,
        data: `No pending tasks found containing "${parameters.text}"`
      });
    }

    if (matchingTasks.length > 1) {
      const taskList = matchingTasks.map(task => `- ${task.text}`).join('\n');
      throw new MCPError({
        ...MCP_ERRORS.VALIDATION_ERROR,
        data: `Multiple tasks found containing "${parameters.text}". Please be more specific:\n${taskList}`
      });
    }

    const task = matchingTasks[0];
    const updatedTask = this.taskService.updateTask(task.id, {
      completed: true,
      updatedAt: new Date()
    });

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: `Task "${updatedTask!.text}" marked as completed`
        }
      ]
    };

    logger.info('Task completed by text search', { task: updatedTask, searchText });
    return result;
  }

  private async analyzeTasks(parameters: { analysis_type: AnalysisType }): Promise<ToolResult> {
    const analytics = this.taskService.getAnalytics();
    
    let analysis = '';

    if (parameters.analysis_type === 'summary') {
      analysis = `Task Summary: ${analytics.total} total tasks, ${analytics.completed} completed, ${analytics.pending} pending`;
    } else if (parameters.analysis_type === 'progress') {
      const completionRate = analytics.total > 0 ? (analytics.completed / analytics.total * 100).toFixed(1) : '0';
      analysis = `Progress: ${completionRate}% completion rate`;
    } else if (parameters.analysis_type === 'suggestions') {
      analysis = analytics.pending > 0 ? 
        `Suggestions: You have ${analytics.pending} pending tasks. Consider prioritizing them.` :
        'Great job! All tasks are completed.';
    }

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: analysis
        }
      ]
    };

    return result;
  }

  private async deleteTask(parameters: { id: string }): Promise<ToolResult> {
    const task = this.taskService.getTaskById(parameters.id);
    if (!task) {
      throw new MCPError({
        ...MCP_ERRORS.VALIDATION_ERROR,
        data: `Task with ID ${parameters.id} not found`
      });
    }

    this.taskService.deleteTask(parameters.id);

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: `Task "${task.text}" deleted successfully`
        }
      ]
    };

    logger.info('Task deleted', { task });
    return result;
  }

  private async clearAllTasks(_parameters: any): Promise<ToolResult> {
    const clearedCount = this.taskService.getTotalCount();
    this.taskService.clearAllTasks();

    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: `Cleared ${clearedCount} tasks from the todo list`
        }
      ]
    };

    logger.info('All tasks cleared', { count: clearedCount });
    return result;
  }
}