import { z } from 'zod';

// Enums
export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  REVIEW = 'review',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Zod schemas for validation
export const RequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.nativeEnum(Priority),
  acceptanceCriteria: z.array(z.string()),
  tags: z.array(z.string()).optional()
});

export const TimelineSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  milestones: z.array(z.object({
    name: z.string(),
    date: z.string(),
    description: z.string()
  })).optional()
});

export const PRDSchema = z.object({
  title: z.string(),
  overview: z.string(),
  problemStatement: z.string(),
  goals: z.array(z.string()),
  requirements: z.array(RequirementSchema),
  acceptanceCriteria: z.array(z.string()),
  timeline: TimelineSchema,
  assumptions: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  risksAndMitigation: z.array(z.object({
    risk: z.string(),
    mitigation: z.string()
  })).optional()
});

export const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(Priority),
  subtasks: z.array(z.string()).optional(), // Task IDs
  dependencies: z.array(z.string()).optional(), // Task IDs
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).optional(),
  created: z.string(),
  updated: z.string(),
  dueDate: z.string().optional(),
  notes: z.string().optional()
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  prd: PRDSchema,
  tasks: z.array(z.string()).optional(), // Task IDs
  status: z.nativeEnum(ProjectStatus),
  created: z.string(),
  updated: z.string(),
  tags: z.array(z.string()).optional(),
  repository: z.string().optional(),
  documentation: z.string().optional()
});

// TypeScript interfaces derived from schemas
export type Requirement = z.infer<typeof RequirementSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type PRD = z.infer<typeof PRDSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Project = z.infer<typeof ProjectSchema>;

// Response types for MCP tools
export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  taskCount: number;
  completedTasks: number;
  created: string;
  updated: string;
}

export interface TaskSummary {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  estimatedHours?: number | undefined;
  actualHours?: number | undefined;
  created: string;
  updated: string;
}

export interface ProjectStatusReport {
  project: ProjectSummary;
  tasks: TaskSummary[];
  completionPercentage: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  upcomingDeadlines: Array<{
    taskId: string;
    title: string;
    dueDate: string;
  }>;
}

// Filter types
export interface TaskFilter {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  tags?: string[];
}

export interface ProjectFilter {
  status?: ProjectStatus;
  tags?: string[];
  hasRepository?: boolean;
}
