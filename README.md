# One Ring Task Manager MCP

A TypeScript-based Model Context Protocol (MCP) server that provides AI agents with sophisticated task and project management capabilities. The One Ring Task Manager enables breaking down large projects into manageable chunks while maintaining context and relationships between tasks.

## Features

- **Project & PRD Management**: Store and organize Product Requirements Documents
- **Task Management**: Create, track, and decompose tasks with dependencies
- **AI Integration**: Full MCP protocol implementation for seamless AI interaction
- **Data Persistence**: Local file-based storage in `.one-ring` hidden directory
- **Status Tracking**: Monitor project and task progress with detailed reporting

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run the built server
npm start
```

## Directory Structure

```
one-ring/                    # Main project directory
├── src/
│   ├── server.ts           # MCP server entry point
│   ├── models/             # Data models and schemas
│   ├── handlers/           # MCP tool handlers
│   └── utils/              # Utility functions
├── package.json
├── tsconfig.json
├── README.md
└── .one-ring/              # Hidden data directory
    ├── data/
    │   ├── projects/       # Project JSON files
    │   └── tasks/          # Task JSON files
    ├── config/
    └── templates/          # PRD templates
```

## MCP Tools

The server exposes the following MCP tools for AI agents:

### Project Management
- `create_project` - Create a new project with PRD
- `list_projects` - List all projects with optional filtering
- `get_project` - Get detailed project information
- `update_project` - Update project information
- `get_project_status` - Get comprehensive project status report

### Task Management
- `create_task` - Create a new task
- `list_tasks` - List tasks with optional filtering
- `get_task` - Get detailed task information
- `update_task` - Update task status and details
- `decompose_task` - Break a task into smaller subtasks

## Usage Examples

### Creating a Project

```typescript
// Example PRD structure for create_project
{
  "name": "My New Project",
  "description": "A sample project for demonstration",
  "prd": {
    "title": "Sample Project PRD",
    "overview": "This project demonstrates the task manager capabilities",
    "problemStatement": "Need to organize complex projects efficiently",
    "goals": [
      "Implement project management system",
      "Enable task decomposition",
      "Provide progress tracking"
    ],
    "requirements": [
      {
        "id": "req-1",
        "title": "Project Creation",
        "description": "System must allow creating new projects",
        "priority": "high",
        "acceptanceCriteria": [
          "User can create project with name and description",
          "PRD can be attached to project"
        ]
      }
    ],
    "acceptanceCriteria": [
      "All requirements are implemented",
      "System is tested and documented"
    ],
    "timeline": {
      "startDate": "2025-01-01",
      "endDate": "2025-03-01",
      "milestones": [
        {
          "name": "Phase 1 Complete",
          "date": "2025-02-01",
          "description": "Core functionality implemented"
        }
      ]
    }
  }
}
```

### Creating Tasks

```typescript
// Example task creation
{
  "projectId": "project-id-here",
  "title": "Implement user authentication",
  "description": "Add login and registration functionality",
  "priority": "high",
  "estimatedHours": 8,
  "dueDate": "2025-01-15T00:00:00Z"
}
```

### Task Decomposition

```typescript
// Example task decomposition
{
  "taskId": "parent-task-id",
  "subtasks": [
    {
      "title": "Design login form",
      "description": "Create UI mockups and validation logic",
      "priority": "medium",
      "estimatedHours": 3
    },
    {
      "title": "Implement authentication backend",
      "description": "Set up JWT tokens and password hashing",
      "priority": "high",
      "estimatedHours": 5
    }
  ]
}
```

## Data Models

### Project
- ID, name, description
- Complete PRD with requirements and timeline
- Status tracking (planning, in_progress, on_hold, completed, cancelled)
- Tags and repository information
- Creation and update timestamps

### Task
- ID, project association, title, description
- Status (todo, in_progress, blocked, review, done, cancelled)
- Priority levels (low, medium, high, critical)
- Time estimates and actual hours
- Dependencies and subtask relationships
- Assignee and due date information

### PRD (Product Requirements Document)
- Title, overview, problem statement
- Goals and requirements list
- Acceptance criteria
- Timeline with milestones
- Risk assessment and constraints

## Integration with AI Agents

The MCP server is designed to work seamlessly with AI development agents. Agents can:

1. **Create Projects**: Start new projects with comprehensive PRDs
2. **Decompose Work**: Break large projects into manageable tasks
3. **Track Progress**: Monitor completion status and time estimates
4. **Manage Dependencies**: Organize tasks with proper sequencing
5. **Generate Reports**: Get detailed project status and progress reports

## Using from Other Projects

To use the One Ring Task Manager in your projects:

### Option 1: Automatic Setup (Recommended)

Run the installation script from your project directory:

```bash
# From your project root directory
/Users/bmize/Workspace/code/one-ring/.one-ring/config/install-one-ring.sh
```

This will:
- Create the `.one-ring` directory structure in your project
- Set up the MCP configuration
- Create a project marker file
- Configure VS Code settings (if needed)

### Option 2: Manual Setup

1. **Create project structure**:
   ```bash
   mkdir -p .one-ring/{data/projects,data/tasks,backups,config}
   echo "$(basename $(pwd))" > .one-ring-project
   ```

2. **Copy MCP configuration**:
   ```bash
   cp /Users/bmize/Workspace/code/one-ring/.one-ring/config/mcp-settings-template.json .one-ring/config/
   ```

3. **Configure VS Code**: Copy the MCP settings to `.vscode/settings.json`

### Project-Specific Data Storage
The task manager dynamically creates `.one-ring/data/` directories when you first create a project. This enables:
- **Dynamic Discovery**: Finds the correct project directory when tools are used
- **Project-specific**: Task tracking and PRDs are isolated per project
- **Git Integration**: Project management data is version controlled with your code
- **No Premature Creation**: No directories created until actually needed
- **Context-Aware**: Uses project markers (`.git`, `package.json`, etc.) to find the right location
- **Self-contained**: Configuration travels with your project

## Configuration

Server configuration is stored in `.one-ring/config/server.json` (created automatically on first run).

## Backup and Recovery

The system includes automatic backup functionality:

```bash
# Backups are stored in .one-ring/backups/
# Each backup is timestamped for easy recovery
```

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5.3+

### Scripts
- `npm run build` - Compile TypeScript
- `npm run dev` - Run in development mode with ts-node
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests (when implemented)

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

---

The One Ring Task Manager brings order to the chaos of complex development projects, providing AI agents with the tools they need to manage and execute large-scale initiatives efficiently.
