#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StorageManager } from './utils/storage.js';
import { TaskManagerHandlers } from './handlers/index.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Get package.json version dynamically
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = packageJson.version;

class OneRingTaskManagerServer {
  private server: Server;
  private storage: StorageManager;
  private handlers: TaskManagerHandlers;

  constructor() {
    this.server = new Server(
      {
        name: 'one-ring-task-manager',
        version: VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.storage = new StorageManager();
    this.handlers = new TaskManagerHandlers(this.storage);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.handlers.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        const result = await this.handlers.handleToolCall(name, args);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    // Initialize storage
    await this.storage.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('One Ring Task Manager MCP server running on stdio');
  }
}

// Run the server
const server = new OneRingTaskManagerServer();
server.run().catch((error) => {
  console.error('Failed to run server:', error);
  process.exit(1);
});
