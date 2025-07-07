import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Project, Task, ProjectSchema, TaskSchema } from '../models';

export class StorageManager {
  private readonly dataDir: string;
  private readonly projectsDir: string;
  private readonly tasksDir: string;

  constructor(baseDir: string = '.one-ring') {
    // Use the calling directory from environment variable if available, otherwise fall back to process.cwd()
    const workingDir = process.env.MCP_CALLING_DIR || process.env.PWD || process.cwd();
    this.dataDir = path.join(workingDir, baseDir, 'data');
    this.projectsDir = path.join(this.dataDir, 'projects');
    this.tasksDir = path.join(this.dataDir, 'tasks');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(this.projectsDir, { recursive: true });
    await fs.mkdir(this.tasksDir, { recursive: true });
  }

  // Project operations
  async saveProject(project: Project): Promise<void> {
    const validated = ProjectSchema.parse(project);
    const filePath = path.join(this.projectsDir, `${project.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(validated, null, 2));
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const filePath = path.join(this.projectsDir, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return ProjectSchema.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      const files = await fs.readdir(this.projectsDir);
      const projects: Project[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.projectsDir, file), 'utf-8');
          const data = JSON.parse(content);
          projects.push(ProjectSchema.parse(data));
        }
      }
      
      return projects.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.projectsDir, `${id}.json`);
      await fs.unlink(filePath);
      
      // Also delete associated tasks
      const tasks = await this.listTasks({ projectId: id });
      await Promise.all(tasks.map(task => this.deleteTask(task.id)));
      
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  // Task operations
  async saveTask(task: Task): Promise<void> {
    const validated = TaskSchema.parse(task);
    const filePath = path.join(this.tasksDir, `${task.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(validated, null, 2));
  }

  async getTask(id: string): Promise<Task | null> {
    try {
      const filePath = path.join(this.tasksDir, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return TaskSchema.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async listTasks(filter: { projectId?: string } = {}): Promise<Task[]> {
    try {
      const files = await fs.readdir(this.tasksDir);
      const tasks: Task[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.tasksDir, file), 'utf-8');
          const data = JSON.parse(content);
          const task = TaskSchema.parse(data);
          
          if (!filter.projectId || task.projectId === filter.projectId) {
            tasks.push(task);
          }
        }
      }
      
      return tasks.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.tasksDir, `${id}.json`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  // Utility functions
  generateId(): string {
    return uuidv4();
  }

  getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  async backup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.dataDir, '..', 'backups', timestamp);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    // Copy projects
    const projectBackupDir = path.join(backupDir, 'projects');
    await fs.mkdir(projectBackupDir, { recursive: true });
    
    try {
      const projectFiles = await fs.readdir(this.projectsDir);
      await Promise.all(
        projectFiles.map(file => 
          fs.copyFile(
            path.join(this.projectsDir, file),
            path.join(projectBackupDir, file)
          )
        )
      );
    } catch (error) {
      // Directory might not exist yet
    }
    
    // Copy tasks
    const taskBackupDir = path.join(backupDir, 'tasks');
    await fs.mkdir(taskBackupDir, { recursive: true });
    
    try {
      const taskFiles = await fs.readdir(this.tasksDir);
      await Promise.all(
        taskFiles.map(file => 
          fs.copyFile(
            path.join(this.tasksDir, file),
            path.join(taskBackupDir, file)
          )
        )
      );
    } catch (error) {
      // Directory might not exist yet
    }
    
    return backupDir;
  }
}
