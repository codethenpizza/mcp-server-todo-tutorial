import { JSON_RPC_ERRORS, MCP_ERRORS, TOOL_SCHEMAS } from '../core/constants';
import { JsonRpcError } from '../types/mcp';

export class MCPValidator {
  static validateJsonRpcRequest(request: any): boolean {
    if (!request || typeof request !== 'object') {
      throw { ...JSON_RPC_ERRORS.INVALID_REQUEST, data: 'Request must be an object' };
    }

    if (request.jsonrpc !== '2.0') {
      throw { ...JSON_RPC_ERRORS.INVALID_REQUEST, data: 'Invalid jsonrpc version' };
    }

    if (!request.method || typeof request.method !== 'string') {
      throw { ...JSON_RPC_ERRORS.INVALID_REQUEST, data: 'Method is required and must be a string' };
    }

    if (request.id !== undefined && !['string', 'number'].includes(typeof request.id)) {
      throw { ...JSON_RPC_ERRORS.INVALID_REQUEST, data: 'ID must be a string or number' };
    }

    return true;
  }

  static validateToolParameters(toolName: string, parameters: any): boolean {
    const schema = TOOL_SCHEMAS[toolName];
    if (!schema) {
      throw { ...MCP_ERRORS.TOOL_NOT_FOUND, data: `Tool '${toolName}' is not available` };
    }

    if (!parameters || typeof parameters !== 'object') {
      throw { ...MCP_ERRORS.VALIDATION_ERROR, data: 'Tool parameters must be provided as an object' };
    }

    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in parameters)) {
          throw { 
            ...MCP_ERRORS.VALIDATION_ERROR, 
            data: `Required parameter '${required}' is missing` 
          };
        }
      }
    }

    for (const [key, value] of Object.entries(parameters)) {
      const propSchema = schema.properties[key];
      if (!propSchema) {
        if (!schema.additionalProperties) {
          throw { 
            ...MCP_ERRORS.VALIDATION_ERROR, 
            data: `Parameter '${key}' is not supported` 
          };
        }
        continue;
      }

      this.validateProperty(key, value, propSchema);
    }

    return true;
  }

  static validateProperty(key: string, value: any, schema: any): void {
    if (schema.type && typeof value !== schema.type) {
      throw { 
        ...MCP_ERRORS.VALIDATION_ERROR, 
        data: `Parameter '${key}' must be of type ${schema.type}` 
      };
    }

    if (schema.type === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        throw { 
          ...MCP_ERRORS.VALIDATION_ERROR, 
          data: `Parameter '${key}' must be at least ${schema.minLength} characters` 
        };
      }

      if (schema.maxLength && value.length > schema.maxLength) {
        throw { 
          ...MCP_ERRORS.VALIDATION_ERROR, 
          data: `Parameter '${key}' must be at most ${schema.maxLength} characters` 
        };
      }

      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        throw { 
          ...MCP_ERRORS.VALIDATION_ERROR, 
          data: `Parameter '${key}' does not match required pattern` 
        };
      }

      if (schema.enum && !schema.enum.includes(value)) {
        throw { 
          ...MCP_ERRORS.VALIDATION_ERROR, 
          data: `Parameter '${key}' must be one of: ${schema.enum.join(', ')}` 
        };
      }
    }
  }

  static validateProtocolVersion(clientVersion: string): boolean {
    const supportedVersions = ['2025-06-18', '2025-03-26'];
    if (!supportedVersions.includes(clientVersion)) {
      throw { 
        ...MCP_ERRORS.UNSUPPORTED_PROTOCOL, 
        data: `Protocol version '${clientVersion}' is not supported` 
      };
    }
    return true;
  }

  static validateCapabilities(clientCapabilities: any): boolean {
    if (!clientCapabilities || typeof clientCapabilities !== 'object') {
      throw { 
        ...MCP_ERRORS.VALIDATION_ERROR, 
        data: 'Client capabilities must be provided as an object' 
      };
    }
    return true;
  }
}

export class MCPError extends Error {
  public code: number;
  public data?: any;

  constructor(errorObj: JsonRpcError) {
    super(errorObj.message);
    this.code = errorObj.code;
    this.data = errorObj.data;
    this.name = 'MCPError';
  }

  toJSON(): JsonRpcError {
    return {
      code: this.code,
      message: this.message,
      data: this.data
    };
  }
}