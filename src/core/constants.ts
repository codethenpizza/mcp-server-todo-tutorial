import { MCPCapabilities, ToolInputSchema, JsonRpcError } from '../types/mcp';

export const MCP_PROTOCOL_VERSION = '2025-06-18';

export const JSON_RPC_ERRORS: Record<string, JsonRpcError> = {
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' }
};

export const MCP_ERRORS: Record<string, JsonRpcError> = {
  UNSUPPORTED_PROTOCOL: { code: -32000, message: 'Protocol version not supported by server' },
  CAPABILITY_NOT_SUPPORTED: { code: -32001, message: 'Requested capability not supported' },
  RESOURCE_NOT_FOUND: { code: -32002, message: 'Requested resource does not exist' },
  TOOL_NOT_FOUND: { code: -32003, message: 'Requested tool does not exist' },
  UNAUTHORIZED: { code: -32004, message: 'Access denied for requested operation' },
  RATE_LIMITED: { code: -32005, message: 'Request rate limit exceeded' },
  VALIDATION_ERROR: { code: -32006, message: 'Request parameters failed validation' }
};

export const MCP_CAPABILITIES: MCPCapabilities = {
  tools: {
    listChanged: true
  },
  resources: {
    subscribe: true,
    listChanged: true
  },
  logging: {}
};

export const TOOL_SCHEMAS: Record<string, ToolInputSchema> = {
  create_task: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
        description: 'The text content of the task to create'
      }
    },
    required: ['text'],
    additionalProperties: false
  },
  
  get_tasks: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        enum: ['all', 'pending', 'completed'],
        description: 'Filter tasks by status'
      }
    },
    required: ['filter'],
    additionalProperties: false
  },
  
  update_task: {
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
    required: ['id', 'completed'],
    additionalProperties: false
  },
  
  analyze_tasks: {
    type: 'object',
    properties: {
      analysis_type: {
        type: 'string',
        enum: ['summary', 'progress', 'suggestions'],
        description: 'Type of analysis to perform'
      }
    },
    required: ['analysis_type'],
    additionalProperties: false
  },
  
  complete_task_by_text: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
        description: 'The text content of the task to mark as completed (supports partial matching)'
      }
    },
    required: ['text'],
    additionalProperties: false
  },
  
  delete_task: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
        description: 'The UUID of the task to delete'
      }
    },
    required: ['id'],
    additionalProperties: false
  },
  
  clear_all_tasks: {
    type: 'object',
    properties: {},
    additionalProperties: false
  }
};