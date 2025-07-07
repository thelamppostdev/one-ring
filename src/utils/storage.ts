import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Project, Task, ProjectSchema, TaskSchema } from '../models';

interface ProjectConfig {
  projectDirectory: string;
  projectName: string;
  created: string;
  updated: string;
}

export class StorageManager {
  private readonly baseDir: string;
  private cachedProjectDir: string | null = null;
  private overrideWorkingDir: string | null = null;

  constructor(baseDir: string = '.one-ring') {
    this.baseDir = baseDir;
    console.error(`StorageManager initialized with baseDir: ${baseDir}`);
  }

  // Allow setting working directory for this operation
  setWorkingDirectory(dir: string): void {
    this.overrideWorkingDir = dir;
    this.cachedProjectDir = null; // Clear cache when directory changes
    console.error(`Working directory set to: ${dir}`);
  }

  // Check for existing project configuration in current directory
  private async findLocalProjectConfig(dir: string): Promise<ProjectConfig | null> {
    try {
      const configPath = path.join(dir, this.baseDir, 'config.json');
      const configData = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      console.error(`Found project config in: ${dir}`);
      return configData;
    } catch (error) {
      // Config doesn't exist in this directory
      return null;
    }
  }

  // Create or update project configuration
  private async saveProjectConfig(projectDir: string): Promise<void> {
    const configDir = path.join(projectDir, this.baseDir);
    const configPath = path.join(configDir, 'config.json');
    
    await fs.mkdir(configDir, { recursive: true });
    
    const config: ProjectConfig = {
      projectDirectory: projectDir,
      projectName: path.basename(projectDir),
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    // If config already exists, preserve the created date
    try {
      const existingConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      config.created = existingConfig.created;
    } catch (error) {
      // Config doesn't exist yet, use new created date
    }
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.error(`Saved project config for: ${projectDir}`);
  }

  private async getProjectDirectory(): Promise<{ dataDir: string; projectsDir: string; tasksDir: string }> {
    // If we've already found a project directory, use the cached one
    if (this.cachedProjectDir) {
      const dataDir = path.join(this.cachedProjectDir, this.baseDir, 'data');
      return {
        dataDir,
        projectsDir: path.join(dataDir, 'projects'),
        tasksDir: path.join(dataDir, 'tasks')
      };
    }

    let workingDir: string;

    // If we have an override, use that
    if (this.overrideWorkingDir) {
      workingDir = this.overrideWorkingDir;
      console.error(`Using override working directory: ${workingDir}`);
    } else {
      // Use process.cwd() as the working directory
      workingDir = process.cwd();
      console.error(`Using current working directory: ${workingDir}`);
      
      // Check if there's already a project config in this directory
      const existingConfig = await this.findLocalProjectConfig(workingDir);
      if (!existingConfig) {
        // No existing config, create a new one
        await this.saveProjectConfig(workingDir);
        console.error(`Created new project config for: ${workingDir}`);
      }
    }
    
    // Cache the result
    this.cachedProjectDir = workingDir;
    
    const dataDir = path.join(workingDir, this.baseDir, 'data');
    const dirs = {
      dataDir,
      projectsDir: path.join(dataDir, 'projects'),
      tasksDir: path.join(dataDir, 'tasks')
    };
    
    console.error(`Data directory: ${dirs.dataDir}`);
    console.error(`Projects directory: ${dirs.projectsDir}`);
    
    return dirs;
  }

  // Project operations
  async saveProject(project: Project): Promise<void> {
    const validated = ProjectSchema.parse(project);
    const { projectsDir } = await this.getProjectDirectory();
    
    // Ensure directories exist
    await fs.mkdir(projectsDir, { recursive: true });
    
    const filePath = path.join(projectsDir, `${project.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(validated, null, 2));
    
    // Update project config with current timestamp
    if (this.cachedProjectDir) {
      await this.saveProjectConfig(this.cachedProjectDir);
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const { projectsDir } = await this.getProjectDirectory();
      const filePath = path.join(projectsDir, `${id}.json`);
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
      const { projectsDir } = await this.getProjectDirectory();
      const files = await fs.readdir(projectsDir);
      const projects: Project[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(projectsDir, file), 'utf-8');
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
      const { projectsDir } = await this.getProjectDirectory();
      const filePath = path.join(projectsDir, `${id}.json`);
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
    const { tasksDir } = await this.getProjectDirectory();
    
    // Ensure directories exist
    await fs.mkdir(tasksDir, { recursive: true });
    
    const filePath = path.join(tasksDir, `${task.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(validated, null, 2));
  }

  async getTask(id: string): Promise<Task | null> {
    try {
      const { tasksDir } = await this.getProjectDirectory();
      const filePath = path.join(tasksDir, `${id}.json`);
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
      const { tasksDir } = await this.getProjectDirectory();
      const files = await fs.readdir(tasksDir);
      const tasks: Task[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
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
      const { tasksDir } = await this.getProjectDirectory();
      const filePath = path.join(tasksDir, `${id}.json`);
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
    const { dataDir, projectsDir, tasksDir } = await this.getProjectDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(dataDir, '..', 'backups', timestamp);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    // Copy projects
    const projectBackupDir = path.join(backupDir, 'projects');
    await fs.mkdir(projectBackupDir, { recursive: true });
    
    try {
      const projectFiles = await fs.readdir(projectsDir);
      await Promise.all(
        projectFiles.map(file => 
          fs.copyFile(
            path.join(projectsDir, file),
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
      const taskFiles = await fs.readdir(tasksDir);
      await Promise.all(
        taskFiles.map(file => 
          fs.copyFile(
            path.join(tasksDir, file),
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
