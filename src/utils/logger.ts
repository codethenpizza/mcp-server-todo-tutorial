type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export class MCPLogger {
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, context: Record<string, any> = {}): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [MCP] ${message}${contextStr}`;
  }

  error(message: string, context: Record<string, any> = {}): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  warn(message: string, context: Record<string, any> = {}): void {
    if (this.shouldLog('warn')) {
      console.error(this.formatMessage('warn', message, context));
    }
  }

  info(message: string, context: Record<string, any> = {}): void {
    if (this.shouldLog('info')) {
      console.error(this.formatMessage('info', message, context));
    }
  }

  debug(message: string, context: Record<string, any> = {}): void {
    if (this.shouldLog('debug')) {
      console.error(this.formatMessage('debug', message, context));
    }
  }

  logRequest(method: string, params: any = {}, id: string | number | null = null): void {
    this.debug('Incoming request', { method, params, id });
  }

  logResponse(id: string | number | null, result: any = null, error: any = null): void {
    const level = error ? 'error' : 'debug';
    const message = error ? 'Request failed' : 'Request successful';
    this[level](message, { id, result: error ? undefined : result, error });
  }

  logToolExecution(toolName: string, parameters: any, result: any = null, error: any = null): void {
    const level = error ? 'error' : 'info';
    const message = error ? `Tool execution failed: ${toolName}` : `Tool executed: ${toolName}`;
    this[level](message, { 
      tool: toolName, 
      parameters, 
      result: error ? undefined : result, 
      error 
    });
  }

  logWebSocketEvent(event: string, data: Record<string, any> = {}): void {
    this.info(`WebSocket event: ${event}`, data);
  }

  logProtocolEvent(event: string, data: Record<string, any> = {}): void {
    this.info(`MCP protocol event: ${event}`, data);
  }
}

export const logger = new MCPLogger((process.env.LOG_LEVEL as LogLevel) || 'info');