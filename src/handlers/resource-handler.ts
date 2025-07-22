import { MCPError } from '../utils/validator';
import { MCP_ERRORS } from '../core/constants';
import { logger } from '../utils/logger';
import { TaskService } from '../services/task-service';
import { MCPResource, ResourceResult } from '../types/mcp';

const resourceDefinitions: MCPResource[] = [
  {
    uri: 'todo://tasks',
    name: 'All Tasks',
    description: 'Complete list of all tasks with metadata',
    mimeType: 'application/json'
  },
  {
    uri: 'todo://tasks/pending',
    name: 'Pending Tasks',
    description: 'List of incomplete tasks requiring attention',
    mimeType: 'application/json'
  },
  {
    uri: 'todo://tasks/completed',
    name: 'Completed Tasks',
    description: 'List of successfully completed tasks',
    mimeType: 'application/json'
  },
  {
    uri: 'todo://analytics/summary',
    name: 'Task Analytics',
    description: 'Statistical summary of task completion and progress',
    mimeType: 'application/json'
  }
];

export class ResourceHandler {
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    this.taskService = taskService;
  }

  static getResourceDefinitions(): MCPResource[] {
    return resourceDefinitions;
  }

  async readResource(uri: string): Promise<ResourceResult> {
    logger.info('Resource read', { uri });

    try {
      let content: string;

      switch (uri) {
        case 'todo://tasks':
          const allTasks = this.taskService.getAllTasks();
          content = JSON.stringify(allTasks, null, 2);
          break;

        case 'todo://tasks/pending':
          const pendingTasks = this.taskService.getTasksByFilter('pending');
          content = JSON.stringify(pendingTasks, null, 2);
          break;

        case 'todo://tasks/completed':
          const completedTasks = this.taskService.getTasksByFilter('completed');
          content = JSON.stringify(completedTasks, null, 2);
          break;

        case 'todo://analytics/summary':
          const summaryAnalytics = this.taskService.getAnalytics();
          const analyticsData = {
            total_tasks: summaryAnalytics.total,
            completed_tasks: summaryAnalytics.completed,
            pending_tasks: summaryAnalytics.pending,
            completion_rate: summaryAnalytics.total > 0 ?
              (summaryAnalytics.completed / summaryAnalytics.total * 100).toFixed(1) : '0',
            last_updated: new Date().toISOString()
          };
          content = JSON.stringify(analyticsData, null, 2);
          break;

        default:
          throw new MCPError({
            ...MCP_ERRORS.VALIDATION_ERROR,
            data: `Unknown resource: ${uri}`
          });
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: content
          }
        ]
      };
    } catch (error) {
      logger.error('Resource error', { uri, error: (error as Error).message });
      throw error;
    }
  }
}
