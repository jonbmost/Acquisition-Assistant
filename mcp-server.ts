#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Knowledge base directory
const KNOWLEDGE_BASE_DIR = join(__dirname, 'knowledge-base');

// Create server instance
const server = new Server(
  {
    name: 'acquisition-assistant',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Helper function to read all knowledge base files
async function getKnowledgeBaseFiles(): Promise<string[]> {
  try {
    const files = await readdir(KNOWLEDGE_BASE_DIR);
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error('Error reading knowledge base directory:', error);
    return [];
  }
}

// Helper function to read a knowledge base file
async function readKnowledgeBaseFile(filename: string): Promise<string> {
  try {
    const filePath = join(KNOWLEDGE_BASE_DIR, filename);
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filename}: ${error}`);
  }
}

// List available resources (knowledge base files)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const files = await getKnowledgeBaseFiles();

  return {
    resources: files.map(file => ({
      uri: `acquisition://knowledge-base/${file}`,
      name: file.replace('.md', '').replace(/-/g, ' '),
      description: `Federal acquisition template/reference: ${file.replace('.md', '')}`,
      mimeType: 'text/markdown',
    })),
  };
});

// Read a specific resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);

  if (url.protocol === 'acquisition:' && url.hostname === 'knowledge-base') {
    const filename = url.pathname.slice(1); // Remove leading slash
    const content = await readKnowledgeBaseFile(filename);

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_knowledge_base',
        description: 'Search through federal acquisition templates and references for specific information',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant information in the knowledge base',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_template',
        description: 'Retrieve a specific federal acquisition template or reference document',
        inputSchema: {
          type: 'object',
          properties: {
            template_name: {
              type: 'string',
              description: 'Name of the template (e.g., "PWS Template", "QASP-Template", "SOO Template")',
              enum: [
                'FAR-Quick-Reference',
                'PWS Template',
                'QASP-Template',
                'README',
                'REQUEST FOR QUOTE (RFQ) TEMPLATE',
                'SOO Template',
                'SOP Template',
                'eval template',
              ],
            },
          },
          required: ['template_name'],
        },
      },
      {
        name: 'get_far_guidance',
        description: 'Get guidance on Federal Acquisition Regulation (FAR) topics and compliance',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'The FAR topic or regulation you need guidance on (e.g., "agile contracting", "commercial items", "evaluation factors")',
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'list_templates',
        description: 'List all available federal acquisition templates and references',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'search_knowledge_base': {
      const query = (args as { query: string }).query.toLowerCase();
      const files = await getKnowledgeBaseFiles();
      const results: Array<{ file: string; matches: string[] }> = [];

      for (const file of files) {
        const content = await readKnowledgeBaseFile(file);
        const lines = content.split('\n');
        const matches = lines.filter(line =>
          line.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
          results.push({
            file: file.replace('.md', ''),
            matches: matches.slice(0, 5), // Limit to 5 matches per file
          });
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: results.length > 0
              ? `Found ${results.length} file(s) with matches for "${query}":\n\n` +
                results.map(r =>
                  `**${r.file}**:\n${r.matches.map(m => `  - ${m.trim()}`).join('\n')}`
                ).join('\n\n')
              : `No matches found for "${query}"`,
          },
        ],
      };
    }

    case 'get_template': {
      const templateName = (args as { template_name: string }).template_name;
      const filename = `${templateName}.md`;
      const content = await readKnowledgeBaseFile(filename);

      return {
        content: [
          {
            type: 'text',
            text: `# ${templateName}\n\n${content}`,
          },
        ],
      };
    }

    case 'get_far_guidance': {
      const topic = (args as { topic: string }).topic;

      // Search for FAR-related content in the knowledge base
      const farContent = await readKnowledgeBaseFile('FAR-Quick-Reference.md');

      return {
        content: [
          {
            type: 'text',
            text: `# FAR Guidance on: ${topic}\n\n${farContent}\n\n---\n\nFor more detailed information, consult:\n- Federal Acquisition Regulation: https://www.acquisition.gov/browse/index/far\n- FAR Overhaul: https://www.acquisition.gov/far-overhaul`,
          },
        ],
      };
    }

    case 'list_templates': {
      const files = await getKnowledgeBaseFiles();

      return {
        content: [
          {
            type: 'text',
            text: `Available Federal Acquisition Templates and References:\n\n${files.map((f, i) =>
              `${i + 1}. ${f.replace('.md', '').replace(/-/g, ' ')}`
            ).join('\n')}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Acquisition Assistant MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
