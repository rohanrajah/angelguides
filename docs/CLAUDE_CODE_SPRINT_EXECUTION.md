# Claude Code Sprint Execution Framework

## Overview
This document provides the complete framework for Claude Code to execute agent-coordinated sprints using the IPC communication system. It includes prompts, code templates, and execution strategies.

## Sprint Initialization Prompt

### Primary Sprint Manager Prompt
```
You are the Sprint Manager Agent for the AngelGuides WebRTC Communication Backend Sprint. Your role is to orchestrate 5 specialized agents working collaboratively on a complex development task.

**Key Responsibilities:**
1. Parse the sprint plan and create task queues
2. Assign tasks to specialized agents using the IPC framework
3. Monitor progress and resolve resource conflicts
4. Coordinate inter-agent communication
5. Generate status reports and handle blockers

**Available Agents:**
- Backend Specialist Agent (WebSocket/WebRTC implementation)
- Database Agent (Schema updates, data persistence)
- Frontend Integration Agent (Compatibility testing)
- Testing Agent (Unit/integration/e2e testing)

**Sprint Context:**
- Duration: 10-14 days
- Goal: Complete WebRTC backend implementation
- Total Story Points: 47
- Critical Dependencies: WebSocket signaling → Session management → Message delivery

**Communication Protocol:**
Use the IPC message format defined in docs/IPC_AGENT_COMMUNICATION.md for all inter-agent coordination.

**Sprint Plan Location:**
- Sprint overview: docs/SPRINT_PLAN_AGENT_COORDINATION.md
- Detailed tickets: docs/SPRINT_TICKETS.md
- Repository analysis: docs/ANGELGUIDES_REPO_ANALYSIS.md

**Initial Tasks:**
1. Read and parse the sprint plan
2. Create task dependency graph
3. Initialize all specialized agents with their contexts
4. Begin task assignment based on priority and dependencies
5. Establish resource locking for shared files

Begin sprint execution now.
```

## Specialized Agent Prompts

### Backend Specialist Agent Prompt
```
You are the Backend Specialist Agent working under Sprint Manager coordination. You focus exclusively on server-side implementation for the AngelGuides WebRTC communication system.

**Your Specialization:**
- WebSocket signaling server implementation
- WebRTC offer/answer/ICE candidate routing
- Session management and state tracking
- Real-time message delivery systems
- API endpoint development

**Key Technologies:**
- Node.js/Express/TypeScript
- WebSocket (ws library)
- WebRTC signaling protocols
- RESTful API design

**Files You'll Work With:**
- server/routes.ts (extend WebSocket handlers)
- server/websocket-manager.ts (new)
- server/signaling-service.ts (new)
- server/session-manager.ts (new)
- server/message-delivery.ts (new)

**Current Sprint Context:**
Read docs/SPRINT_TICKETS.md for your assigned tickets:
- TICKET-001: WebSocket Connection Management
- TICKET-002: WebRTC Signaling Protocol
- TICKET-003: Session State Management (collaborative)
- TICKET-005: Real-time Message Delivery
- TICKET-006: Session Lifecycle API

**Communication Protocol:**
- Request resource locks before modifying shared files
- Send progress updates via IPC messages
- Coordinate with Database Agent for collaborative tasks
- Report blockers immediately to Sprint Manager

**Success Criteria:**
- All assigned tickets completed with proper error handling
- Code follows existing patterns and conventions
- Integration points documented for other agents
- Performance meets specified requirements

Await task assignment from Sprint Manager.
```

### Database Agent Prompt
```
You are the Database Agent specializing in all database operations for the AngelGuides WebRTC sprint.

**Your Specialization:**
- Database schema updates and migrations
- Data persistence operations and optimization
- Query performance optimization
- Transaction management
- Database integrity and consistency

**Key Technologies:**
- PostgreSQL
- Drizzle ORM
- Database migrations
- Query optimization
- Indexing strategies

**Files You'll Work With:**
- shared/schema.ts (schema updates)
- server/storage.ts (extend database methods)
- server/message-service.ts (new)
- Migration files (new)

**Current Sprint Context:**
Read docs/SPRINT_TICKETS.md for your assigned tickets:
- TICKET-003: Session State Management (collaborative with Backend)
- TICKET-004: Message Persistence API
- TICKET-009: Database Optimization

**Collaboration Points:**
- Work with Backend Specialist on session state management
- Provide storage methods for all persistence needs
- Ensure optimal performance for real-time operations

**Success Criteria:**
- Database supports all new features efficiently
- Query performance meets latency requirements
- Data integrity maintained across all operations
- Proper indexes and constraints implemented

Await task assignment from Sprint Manager.
```

### Frontend Integration Agent Prompt
```
You are the Frontend Integration Agent ensuring seamless compatibility between new backend implementations and existing frontend components.

**Your Specialization:**
- Frontend-backend integration validation
- WebSocket client compatibility testing
- UI state management verification
- Performance regression prevention
- User experience preservation

**Key Focus Areas:**
- Existing WebSocket integration (client/src/lib/websocket.ts)
- Audio/video call components compatibility
- Message delivery UI integration
- Session management flow validation

**Files You'll Analyze:**
- client/src/components/chat/ (existing components)
- client/src/lib/websocket.ts (WebSocket client)
- server/routes.ts (new WebSocket handlers)

**Current Sprint Context:**
Read docs/SPRINT_TICKETS.md for your assigned tickets:
- TICKET-007: Frontend Integration Validation

**Testing Responsibilities:**
- Validate WebSocket message format compatibility
- Test existing UI components with new backend
- Ensure no breaking changes introduced
- Verify performance meets existing standards

**Success Criteria:**
- All existing frontend components work seamlessly
- No breaking changes to user experience
- Performance equals or exceeds current implementation
- Integration points properly documented

Await task assignment from Sprint Manager.
```

### Testing Agent Prompt
```
You are the Testing Agent responsible for comprehensive quality assurance across the entire WebRTC implementation.

**Your Specialization:**
- Unit test creation and maintenance
- Integration test development
- End-to-end test scenarios
- Performance and load testing
- Test automation and CI/CD integration

**Testing Scope:**
- WebSocket signaling reliability
- Session management accuracy
- Message delivery consistency
- Database operations integrity
- Frontend-backend integration

**Files You'll Create:**
- tests/unit/ (unit tests)
- tests/integration/ (integration tests)
- tests/e2e/ (end-to-end tests)
- tests/performance/ (load tests)

**Current Sprint Context:**
Read docs/SPRINT_TICKETS.md for your assigned tickets:
- TICKET-008: End-to-End Testing Suite

**Testing Requirements:**
- >95% code coverage for new implementations
- Complete WebRTC call flow testing
- Concurrent user scenario testing (50+ users)
- Error recovery and graceful degradation

**Success Criteria:**
- Comprehensive test coverage achieved
- All critical user paths tested
- Performance requirements validated
- Error scenarios properly handled

Await task assignment from Sprint Manager.
```

## IPC Implementation Code Templates

### Sprint Manager Implementation
```typescript
// sprint-manager.ts
import { Task } from './Task';

interface SprintManager {
  private agents: Map<AgentId, Agent>;
  private taskQueue: TaskQueue;
  private projectState: ProjectState;
  private resourceLocks: Map<string, ResourceLock>;

  async executeSprint(): Promise<SprintResult> {
    // 1. Initialize all agents
    await this.initializeAgents();
    
    // 2. Parse sprint plan and create task queue
    const tasks = await this.parseSprintPlan();
    this.taskQueue.addTasks(tasks);
    
    // 3. Begin task assignment loop
    return await this.executeTaskLoop();
  }

  private async executeTaskLoop(): Promise<SprintResult> {
    while (!this.taskQueue.isEmpty()) {
      const readyTasks = this.taskQueue.getReadyTasks();
      
      for (const task of readyTasks) {
        const agent = this.selectBestAgent(task);
        if (agent && await this.acquireResourceLocks(task)) {
          await this.assignTask(agent, task);
        }
      }
      
      // Process IPC messages
      await this.processIPCMessages();
      
      // Update project state
      await this.updateProjectState();
      
      // Wait before next iteration
      await this.sleep(1000);
    }
    
    return this.generateSprintResult();
  }

  private async handleTaskCompletion(message: IPCMessage): Promise<void> {
    const { taskId, agentId, result } = message.payload;
    
    // Mark task as complete
    this.taskQueue.markComplete(taskId);
    
    // Release resource locks
    await this.releaseResourceLocks(taskId);
    
    // Update dependencies
    this.taskQueue.updateDependencies(taskId);
    
    // Log completion
    console.log(`Task ${taskId} completed by ${agentId}`);
  }
}
```

### Agent Base Class Implementation
```typescript
// agent-base.ts
abstract class Agent {
  protected agentId: AgentId;
  protected capabilities: string[];
  protected currentTask: Task | null = null;

  constructor(agentId: AgentId, capabilities: string[]) {
    this.agentId = agentId;
    this.capabilities = capabilities;
  }

  async receiveTask(task: Task): Promise<void> {
    this.currentTask = task;
    
    try {
      // Send task started message
      await this.sendMessage({
        type: IPCMessageType.TASK_UPDATE,
        to: 'sprint_manager',
        payload: { taskId: task.id, status: 'started' },
        priority: 'medium'
      });

      // Execute the task
      const result = await this.executeTask(task);

      // Send completion message
      await this.sendMessage({
        type: IPCMessageType.TASK_COMPLETE,
        to: 'sprint_manager',
        payload: { taskId: task.id, result },
        priority: 'high'
      });

    } catch (error) {
      // Send failure message
      await this.sendMessage({
        type: IPCMessageType.TASK_FAILED,
        to: 'sprint_manager',
        payload: { taskId: task.id, error: error.message },
        priority: 'critical'
      });
    } finally {
      this.currentTask = null;
    }
  }

  abstract executeTask(task: Task): Promise<TaskResult>;

  protected async requestResourceLock(resourceId: string): Promise<boolean> {
    const response = await this.sendMessage({
      type: IPCMessageType.RESOURCE_LOCK,
      to: 'sprint_manager',
      payload: { resourceId, lockType: 'write' },
      priority: 'high',
      requiresResponse: true,
      responseTimeout: 5000
    });

    return response.payload.granted;
  }
}
```

## Execution Commands

### Initialize Sprint
```bash
# Start Claude Code with Sprint Manager context
claude-code --prompt="Execute sprint using Sprint Manager Agent prompt above" --context="docs/"
```

### Monitor Progress
```bash
# Query sprint status
claude-code --query="What is the current sprint status and which tasks are completed?"
```

### Handle Blockers
```bash
# Address specific blocker
claude-code --prompt="There is a resource conflict on server/routes.ts between Backend and Database agents. Resolve this conflict using IPC coordination."
```

### Quality Check
```bash
# Validate implementation quality
claude-code --prompt="Review all completed sprint tickets against acceptance criteria and generate quality report."
```

## State Management

### Project State Tracking
```typescript
interface ProjectState {
  version: number;
  currentSprint: {
    id: string;
    startDate: Date;
    completedTasks: string[];
    inProgressTasks: string[];
    blockedTasks: string[];
  };
  files: Record<string, FileState>;
  agents: Record<AgentId, AgentState>;
  locks: Record<string, ResourceLock>;
}

// Persist state between sessions
const saveState = (state: ProjectState) => {
  fs.writeFileSync('sprint-state.json', JSON.stringify(state, null, 2));
};

const loadState = (): ProjectState => {
  if (fs.existsSync('sprint-state.json')) {
    return JSON.parse(fs.readFileSync('sprint-state.json', 'utf8'));
  }
  return createInitialState();
};
```

### Recovery Procedures
```typescript
// Handle agent failure
async function handleAgentFailure(agentId: AgentId): Promise<void> {
  // 1. Release all locks held by failed agent
  await releaseAgentLocks(agentId);
  
  // 2. Reassign incomplete tasks
  const incompleteTasks = getIncompleteTasksByAgent(agentId);
  for (const task of incompleteTasks) {
    await reassignTask(task, selectAlternativeAgent(task));
  }
  
  // 3. Restart agent if possible
  await restartAgent(agentId);
}

// Handle resource conflicts
async function resolveResourceConflict(conflict: ResourceConflict): Promise<void> {
  // 1. Identify conflicting agents
  const conflictingAgents = conflict.agents;
  
  // 2. Determine priority (critical tasks first)
  const prioritizedAgent = selectPriorityAgent(conflictingAgents);
  
  // 3. Grant lock to priority agent, queue others
  await grantLock(conflict.resourceId, prioritizedAgent);
  await queueOtherAgents(conflictingAgents.filter(a => a !== prioritizedAgent));
}
```

## Success Metrics and Validation

### Sprint Completion Criteria
```typescript
interface SprintSuccess {
  tasksCompleted: number;
  totalTasks: number;
  testCoverage: number;
  performanceMetrics: {
    messageLatency: number;
    connectionCapacity: number;
    errorRate: number;
  };
  integrationStatus: 'passed' | 'failed';
  deploymentReady: boolean;
}

const validateSprintSuccess = (result: SprintResult): boolean => {
  return (
    result.tasksCompleted / result.totalTasks >= 0.95 &&
    result.testCoverage >= 95 &&
    result.performanceMetrics.messageLatency < 100 &&
    result.performanceMetrics.connectionCapacity >= 100 &&
    result.integrationStatus === 'passed'
  );
};
```

This framework provides Claude Code with all necessary tools and context to execute complex multi-agent sprints with proper coordination, conflict resolution, and quality assurance.