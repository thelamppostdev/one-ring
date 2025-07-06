import { Tool, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StorageManager } from '../utils/storage.js';
import { 
  Project, 
  Task, 
  ProjectStatus, 
  TaskStatus, 
  Priority,
  ProjectSummary,
  TaskSummary,
  ProjectStatusReport,
  TaskFilter,
  ProjectFilter
} from '../models/index.js';

export class TaskManagerHandlers {
  private storage: StorageManager;

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  // Define all MCP tools
  getTools(): Tool[] {
    return [
      {
        name: 'create_project',
        description: 'Create a new project with PRD',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name' },
            description: { type: 'string', description: 'Project description' },
            prd: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                overview: { type: 'string' },
                problemStatement: { type: 'string' },
                goals: { type: 'array', items: { type: 'string' } },
                requirements: { 
                  type: 'array', 
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                      acceptanceCriteria: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['id', 'title', 'description', 'priority', 'acceptanceCriteria']
                  }
                },
                acceptanceCriteria: { type: 'array', items: { type: 'string' } },
                timeline: {
                  type: 'object',
                  properties: {
                    startDate: { type: 'string' },
                    endDate: { type: 'string' },
                    milestones: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          date: { type: 'string' },
                          description: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              },
              required: ['title', 'overview', 'problemStatement', 'goals', 'requirements', 'acceptanceCriteria', 'timeline']
            },
            tags: { type: 'array', items: { type: 'string' }, description: 'Project tags' },
            repository: { type: 'string', description: 'Repository URL' }
          },
          required: ['name', 'description', 'prd']
        }
      },
      {
        name: 'list_projects',
        description: 'List all projects with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'] },
            tags: { type: 'array', items: { type: 'string' } },
            hasRepository: { type: 'boolean' }
          }
        }
      },
      {
        name: 'get_project',
        description: 'Get detailed project information',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Project ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'update_project',
        description: 'Update project information',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Project ID' },
            name: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'] },
            tags: { type: 'array', items: { type: 'string' } },
            repository: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'create_task',
        description: 'Create a new task',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID' },
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task description' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            estimatedHours: { type: 'number' },
            dueDate: { type: 'string', description: 'ISO date string' },
            dependencies: { type: 'array', items: { type: 'string' }, description: 'Task IDs this task depends on' },
            tags: { type: 'array', items: { type: 'string' } },
            assignee: { type: 'string' }
          },
          required: ['projectId', 'title', 'description', 'priority']
        }
      },
      {
        name: 'list_tasks',
        description: 'List tasks with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            assignee: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'get_task',
        description: 'Get detailed task information',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'update_task',
        description: 'Update task information',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            estimatedHours: { type: 'number' },
            actualHours: { type: 'number' },
            assignee: { type: 'string' },
            notes: { type: 'string' },
            dueDate: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'decompose_task',
        description: 'Break a task into smaller subtasks',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to decompose' },
            subtasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  estimatedHours: { type: 'number' }
                },
                required: ['title', 'description', 'priority']
              }
            }
          },
          required: ['taskId', 'subtasks']
        }
      },
      {
        name: 'get_project_status',
        description: 'Get comprehensive project status report',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Project ID' }
          },
          required: ['id']
        }
      }
    ];
  }

  // Handle tool calls
  async handleToolCall(name: string, arguments_: unknown): Promise<any> {
    switch (name) {
      case 'create_project':
        return this.createProject(arguments_ as any);
      case 'list_projects':
        return this.listProjects(arguments_ as any);
      case 'get_project':
        return this.getProject(arguments_ as any);
      case 'update_project':
        return this.updateProject(arguments_ as any);
      case 'create_task':
        return this.createTask(arguments_ as any);
      case 'list_tasks':
        return this.listTasks(arguments_ as any);
      case 'get_task':
        return this.getTask(arguments_ as any);
      case 'update_task':
        return this.updateTask(arguments_ as any);
      case 'decompose_task':
        return this.decomposeTask(arguments_ as any);
      case 'get_project_status':
        return this.getProjectStatus(arguments_ as any);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // Implementation methods
  private async createProject(args: any): Promise<Project> {
    const id = this.storage.generateId();
    const timestamp = this.storage.getCurrentTimestamp();
    
    const project: Project = {
      id,
      name: args.name,
      description: args.description,
      prd: args.prd,
      tasks: [],
      status: ProjectStatus.PLANNING,
      created: timestamp,
      updated: timestamp,
      tags: args.tags || [],
      repository: args.repository
    };

    await this.storage.saveProject(project);
    return project;
  }

  private async listProjects(filter: ProjectFilter = {}): Promise<ProjectSummary[]> {
    const projects = await this.storage.listProjects();
    
    const filtered = projects.filter(project => {
      if (filter.status && project.status !== filter.status) return false;
      if (filter.hasRepository !== undefined && !!project.repository !== filter.hasRepository) return false;
      if (filter.tags && !filter.tags.every(tag => project.tags?.includes(tag))) return false;
      return true;
    });

    const summaries: ProjectSummary[] = [];
    
    for (const project of filtered) {
      const tasks = await this.storage.listTasks({ projectId: project.id });
      const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
      
      summaries.push({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        taskCount: tasks.length,
        completedTasks,
        created: project.created,
        updated: project.updated
      });
    }

    return summaries;
  }

  private async getProject(args: { id: string }): Promise<Project | null> {
    return this.storage.getProject(args.id);
  }

  private async updateProject(args: any): Promise<Project | null> {
    const project = await this.storage.getProject(args.id);
    if (!project) return null;

    const updated: Project = {
      ...project,
      name: args.name ?? project.name,
      description: args.description ?? project.description,
      status: args.status ?? project.status,
      tags: args.tags ?? project.tags,
      repository: args.repository ?? project.repository,
      updated: this.storage.getCurrentTimestamp()
    };

    await this.storage.saveProject(updated);
    return updated;
  }

  private async createTask(args: any): Promise<Task> {
    const id = this.storage.generateId();
    const timestamp = this.storage.getCurrentTimestamp();
    
    const task: Task = {
      id,
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: TaskStatus.TODO,
      priority: args.priority,
      subtasks: [],
      dependencies: args.dependencies || [],
      estimatedHours: args.estimatedHours,
      actualHours: 0,
      assignee: args.assignee,
      tags: args.tags || [],
      created: timestamp,
      updated: timestamp,
      dueDate: args.dueDate,
      notes: ''
    };

    await this.storage.saveTask(task);
    return task;
  }

  private async listTasks(filter: TaskFilter = {}): Promise<TaskSummary[]> {
    const tasks = await this.storage.listTasks();
    
    const filtered = tasks.filter(task => {
      if (filter.projectId && task.projectId !== filter.projectId) return false;
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.assignee && task.assignee !== filter.assignee) return false;
      if (filter.tags && !filter.tags.every(tag => task.tags?.includes(tag))) return false;
      return true;
    });

    return filtered.map(task => ({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      created: task.created,
      updated: task.updated
    }));
  }

  private async getTask(args: { id: string }): Promise<Task | null> {
    return this.storage.getTask(args.id);
  }

  private async updateTask(args: any): Promise<Task | null> {
    const task = await this.storage.getTask(args.id);
    if (!task) return null;

    const updated: Task = {
      ...task,
      title: args.title ?? task.title,
      description: args.description ?? task.description,
      status: args.status ?? task.status,
      priority: args.priority ?? task.priority,
      estimatedHours: args.estimatedHours ?? task.estimatedHours,
      actualHours: args.actualHours ?? task.actualHours,
      assignee: args.assignee ?? task.assignee,
      notes: args.notes ?? task.notes,
      dueDate: args.dueDate ?? task.dueDate,
      updated: this.storage.getCurrentTimestamp()
    };

    await this.storage.saveTask(updated);
    return updated;
  }

  private async decomposeTask(args: any): Promise<Task[]> {
    const parentTask = await this.storage.getTask(args.taskId);
    if (!parentTask) throw new Error('Parent task not found');

    const subtasks: Task[] = [];
    const subtaskIds: string[] = [];

    for (const subtaskData of args.subtasks) {
      const id = this.storage.generateId();
      const timestamp = this.storage.getCurrentTimestamp();
      
      const subtask: Task = {
        id,
        projectId: parentTask.projectId,
        title: subtaskData.title,
        description: subtaskData.description,
        status: TaskStatus.TODO,
        priority: subtaskData.priority,
        subtasks: [],
        dependencies: [parentTask.id], // Subtasks depend on parent
        estimatedHours: subtaskData.estimatedHours,
        actualHours: 0,
        assignee: parentTask.assignee,
        tags: parentTask.tags,
        created: timestamp,
        updated: timestamp,
        notes: `Subtask of: ${parentTask.title}`
      };

      await this.storage.saveTask(subtask);
      subtasks.push(subtask);
      subtaskIds.push(id);
    }

    // Update parent task with subtask references
    const updatedParent: Task = {
      ...parentTask,
      subtasks: [...(parentTask.subtasks || []), ...subtaskIds],
      updated: this.storage.getCurrentTimestamp()
    };
    
    await this.storage.saveTask(updatedParent);

    return subtasks;
  }

  private async getProjectStatus(args: { id: string }): Promise<ProjectStatusReport | null> {
    const project = await this.storage.getProject(args.id);
    if (!project) return null;

    const tasks = await this.storage.listTasks({ projectId: args.id });
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE);
    
    const taskSummaries: TaskSummary[] = tasks.map(task => ({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      created: task.created,
      updated: task.updated
    }));

    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    
    const upcomingDeadlines = tasks
      .filter(task => task.dueDate && task.status !== TaskStatus.DONE)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5)
      .map(task => ({
        taskId: task.id,
        title: task.title,
        dueDate: task.dueDate!
      }));

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        taskCount: tasks.length,
        completedTasks: completedTasks.length,
        created: project.created,
        updated: project.updated
      },
      tasks: taskSummaries,
      completionPercentage: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
      totalEstimatedHours,
      totalActualHours,
      upcomingDeadlines
    };
  }
}
