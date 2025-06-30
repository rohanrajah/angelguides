import { db } from "../../scripts/db-local";
import { users, messages, sessions, SessionType, UserType } from "../../shared/schema";
import { eq, inArray } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const scryptAsync = promisify(scrypt);

interface MessageType {
  type: 'chat' | 'voice' | 'video';
  size: number; // bytes
  duration?: number; // seconds for voice/video
}

interface LoadTestMetrics {
  totalUsers: number;
  totalMessages: number;
  chatMessages: number;
  voiceMessages: number;
  videoMessages: number;
  totalSessions: number;
  testDuration: number;
  messagesPerSecond: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  bandwidth: BandwidthMetrics;
  timestamp: string;
}

interface BandwidthMetrics {
  totalDataTransferred: number; // bytes
  chatDataTransferred: number;
  voiceDataTransferred: number;
  videoDataTransferred: number;
  avgBandwidthPerSecond: number; // bytes/sec
  peakBandwidth: number;
  networkUtilization: number; // percentage
}

interface TestUser {
  id: number;
  username: string;
  name: string;
}

class LoadTester {
  private testUsers: TestUser[] = [];
  private testUserIds: number[] = [];
  private testMessageIds: number[] = [];
  private testSessionIds: number[] = [];
  private metrics: LoadTestMetrics;
  private startTime: number = 0;
  private responseTimes: number[] = [];
  private bandwidthSamples: number[] = [];
  private messageTypes: MessageType[] = [];

  constructor() {
    this.metrics = {
      totalUsers: 50,
      totalMessages: 0,
      chatMessages: 0,
      voiceMessages: 0,
      videoMessages: 0,
      totalSessions: 0,
      testDuration: 0,
      messagesPerSecond: 0,
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      successfulOperations: 0,
      failedOperations: 0,
      successRate: 0,
      memoryUsage: process.memoryUsage(),
      bandwidth: {
        totalDataTransferred: 0,
        chatDataTransferred: 0,
        voiceDataTransferred: 0,
        videoDataTransferred: 0,
        avgBandwidthPerSecond: 0,
        peakBandwidth: 0,
        networkUtilization: 0
      },
      timestamp: new Date().toISOString()
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  private generateMessageType(): MessageType {
    const rand = Math.random();
    
    if (rand < 0.6) {
      // 60% chat messages
      return {
        type: 'chat',
        size: Math.floor(Math.random() * 500) + 50 // 50-550 bytes
      };
    } else if (rand < 0.8) {
      // 20% voice messages
      const duration = Math.floor(Math.random() * 60) + 5; // 5-65 seconds
      return {
        type: 'voice',
        size: duration * 8000, // ~8KB per second for voice
        duration
      };
    } else {
      // 20% video messages
      const duration = Math.floor(Math.random() * 30) + 10; // 10-40 seconds
      return {
        type: 'video',
        size: duration * 250000, // ~250KB per second for video
        duration
      };
    }
  }

  private generateMessageContent(messageType: MessageType): string {
    switch (messageType.type) {
      case 'chat':
        const chatMessages = [
          "Hello, how are you doing today?",
          "I'm looking for some spiritual guidance.",
          "Can you help me understand my dreams?",
          "What do the cards say about my future?",
          "I feel a strong energy around me lately.",
          "Thank you for the wonderful session!",
          "Your reading was very insightful.",
          "I'd like to book another appointment.",
          "The meditation technique you taught me works great!",
          "I'm grateful for your wisdom and guidance."
        ];
        return chatMessages[Math.floor(Math.random() * chatMessages.length)];
      
      case 'voice':
        return `[VOICE_MESSAGE:${messageType.duration}s:${messageType.size}bytes] Voice recording with spiritual guidance and meditation instructions`;
      
      case 'video':
        return `[VIDEO_MESSAGE:${messageType.duration}s:${messageType.size}bytes] Video session with tarot reading and astrological chart analysis`;
      
      default:
        return "Default message content";
    }
  }

  private async createTestUsers(): Promise<void> {
    this.log("Creating 50 test users...");
    const testUsers = [];
    
    for (let i = 1; i <= 50; i++) {
      const username = `loadtest_user_${i}_${Date.now()}`;
      const user = {
        username,
        password: await this.hashPassword("testpass123"),
        name: `Load Test User ${i}`,
        email: `${username}@loadtest.example.com`,
        userType: UserType.USER,
        profileCompleted: true,
        accountBalance: 1000, // Give them some balance for testing
        isOnline: true,
        lastSeenAt: new Date()
      };
      testUsers.push(user);
    }

    // Insert users in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < testUsers.length; i += batchSize) {
      const batch = testUsers.slice(i, i + batchSize);
      const insertedUsers = await db.insert(users).values(batch).returning({
        id: users.id,
        username: users.username,
        name: users.name
      });
      
      this.testUsers.push(...insertedUsers);
      this.testUserIds.push(...insertedUsers.map(u => u.id));
    }

    this.log(`Successfully created ${this.testUsers.length} test users`);
  }

  private async sendMessage(senderId: number, receiverId: number, messageType: MessageType): Promise<number> {
    const startTime = Date.now();
    const content = this.generateMessageContent(messageType);
    
    try {
      const [newMessage] = await db.insert(messages).values({
        senderId,
        receiverId,
        content,
        timestamp: new Date(),
        read: false
      }).returning({ id: messages.id });

      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.metrics.successfulOperations++;
      this.testMessageIds.push(newMessage.id);
      this.messageTypes.push(messageType);
      
      // Track bandwidth usage
      this.trackBandwidth(messageType);
      
      return responseTime;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.metrics.failedOperations++;
      this.log(`Message send failed: ${error}`);
      return responseTime;
    }
  }

  private async createSession(userId: number, advisorId: number, sessionType: SessionType): Promise<number> {
    const startTime = Date.now();
    
    try {
      const now = new Date();
      const startTime1 = new Date(now.getTime() + Math.random() * 3600000); // Random start within next hour
      const endTime = new Date(startTime1.getTime() + (Math.random() * 3600000) + 1800000); // 30min to 90min session
      
      const rates = { chat: 150, audio: 200, video: 300 };
      const rateKey = sessionType === SessionType.CHAT ? 'chat' : 
                     sessionType === SessionType.AUDIO ? 'audio' : 'video';
      
      const [newSession] = await db.insert(sessions).values({
        userId,
        advisorId,
        startTime: startTime1,
        endTime,
        sessionType,
        status: 'scheduled',
        ratePerMinute: rates[rateKey],
        notes: `Load test ${sessionType} session`
      }).returning({ id: sessions.id });

      this.testSessionIds.push(newSession.id);
      this.metrics.successfulOperations++;
      
      return Date.now() - startTime;
    } catch (error) {
      this.metrics.failedOperations++;
      this.log(`Session creation failed: ${error}`);
      return Date.now() - startTime;
    }
  }

  private trackBandwidth(messageType: MessageType): void {
    this.metrics.bandwidth.totalDataTransferred += messageType.size;
    
    switch (messageType.type) {
      case 'chat':
        this.metrics.bandwidth.chatDataTransferred += messageType.size;
        this.metrics.chatMessages++;
        break;
      case 'voice':
        this.metrics.bandwidth.voiceDataTransferred += messageType.size;
        this.metrics.voiceMessages++;
        break;
      case 'video':
        this.metrics.bandwidth.videoDataTransferred += messageType.size;
        this.metrics.videoMessages++;
        break;
    }
    
    // Track bandwidth sample for peak calculation
    this.bandwidthSamples.push(messageType.size);
  }

  private async runConcurrentMessaging(): Promise<void> {
    this.log("Starting concurrent messaging and session test...");
    this.startTime = Date.now();

    const promises: Promise<number>[] = [];
    const messagesPerUser = 8; // Each user sends 8 messages
    const sessionsPerUser = 2; // Each user creates 2 sessions
    
    // Create advisor users (first 20% are advisors)
    const advisorUsers = this.testUsers.slice(0, Math.floor(this.testUsers.length * 0.2));
    
    // Create concurrent message sending tasks
    for (const user of this.testUsers) {
      for (let msgCount = 0; msgCount < messagesPerUser; msgCount++) {
        // Each user sends messages to random other users
        const randomReceiver = this.testUsers[Math.floor(Math.random() * this.testUsers.length)];
        const messageType = this.generateMessageType();
        
        const messagePromise = this.sendMessage(user.id, randomReceiver.id, messageType);
        promises.push(messagePromise);
      }
      
      // Create sessions with advisors
      for (let sessionCount = 0; sessionCount < sessionsPerUser; sessionCount++) {
        const randomAdvisor = advisorUsers[Math.floor(Math.random() * advisorUsers.length)];
        const sessionTypes = [SessionType.CHAT, SessionType.AUDIO, SessionType.VIDEO];
        const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
        
        const sessionPromise = this.createSession(user.id, randomAdvisor.id, sessionType);
        promises.push(sessionPromise);
      }
    }

    // Execute all operations concurrently
    this.log(`Executing ${promises.length} concurrent operations (messages + sessions)...`);
    await Promise.all(promises);

    this.metrics.testDuration = Date.now() - this.startTime;
    this.metrics.totalMessages = this.messageTypes.length;
    this.metrics.totalSessions = this.testSessionIds.length;
    
    this.log(`Completed ${this.metrics.totalMessages} messages and ${this.metrics.totalSessions} sessions in ${this.metrics.testDuration}ms`);
  }

  private calculateMetrics(): void {
    if (this.responseTimes.length === 0) {
      return;
    }

    this.metrics.avgResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    this.metrics.minResponseTime = Math.min(...this.responseTimes);
    this.metrics.maxResponseTime = Math.max(...this.responseTimes);
    this.metrics.messagesPerSecond = (this.metrics.totalMessages / this.metrics.testDuration) * 1000;
    this.metrics.successRate = (this.metrics.successfulOperations / (this.metrics.successfulOperations + this.metrics.failedOperations)) * 100;
    this.metrics.memoryUsage = process.memoryUsage();
    
    // Calculate bandwidth metrics
    this.calculateBandwidthMetrics();
  }

  private calculateBandwidthMetrics(): void {
    const durationInSeconds = this.metrics.testDuration / 1000;
    
    this.metrics.bandwidth.avgBandwidthPerSecond = this.metrics.bandwidth.totalDataTransferred / durationInSeconds;
    
    // Calculate peak bandwidth (max data transferred in any 1-second window)
    if (this.bandwidthSamples.length > 0) {
      this.metrics.bandwidth.peakBandwidth = Math.max(...this.bandwidthSamples);
    }
    
    // Calculate network utilization (simplified estimation)
    // Assuming 1Gbps network capacity = 125MB/s
    const networkCapacity = 125 * 1024 * 1024; // 125MB/s in bytes
    this.metrics.bandwidth.networkUtilization = (this.metrics.bandwidth.avgBandwidthPerSecond / networkCapacity) * 100;
  }

  private async generateReport(): Promise<string> {
    const report = `
# Load Test Report - 50 Concurrent Users Multi-Modal Communication Test

**Generated**: ${this.metrics.timestamp}
**Test Duration**: ${(this.metrics.testDuration / 1000).toFixed(2)}s

## Test Configuration
- **Total Users**: ${this.metrics.totalUsers}
- **Messages Per User**: 8 (Chat/Voice/Video mix)
- **Sessions Per User**: 2 (Chat/Audio/Video)
- **Test Type**: Concurrent multi-modal messaging and session creation

## Communication Breakdown
- **Total Messages**: ${this.metrics.totalMessages}
  - Chat Messages: ${this.metrics.chatMessages} (${((this.metrics.chatMessages / this.metrics.totalMessages) * 100).toFixed(1)}%)
  - Voice Messages: ${this.metrics.voiceMessages} (${((this.metrics.voiceMessages / this.metrics.totalMessages) * 100).toFixed(1)}%)
  - Video Messages: ${this.metrics.videoMessages} (${((this.metrics.videoMessages / this.metrics.totalMessages) * 100).toFixed(1)}%)
- **Total Sessions Created**: ${this.metrics.totalSessions}

## Performance Metrics
- **Operations Per Second**: ${((this.metrics.totalMessages + this.metrics.totalSessions) / (this.metrics.testDuration / 1000)).toFixed(2)}
- **Messages Per Second**: ${this.metrics.messagesPerSecond.toFixed(2)}
- **Average Response Time**: ${this.metrics.avgResponseTime.toFixed(2)}ms
- **Min Response Time**: ${this.metrics.minResponseTime}ms
- **Max Response Time**: ${this.metrics.maxResponseTime}ms

## Bandwidth & Data Transfer
- **Total Data Transferred**: ${this.formatBytes(this.metrics.bandwidth.totalDataTransferred)}
- **Chat Data**: ${this.formatBytes(this.metrics.bandwidth.chatDataTransferred)}
- **Voice Data**: ${this.formatBytes(this.metrics.bandwidth.voiceDataTransferred)}
- **Video Data**: ${this.formatBytes(this.metrics.bandwidth.videoDataTransferred)}
- **Average Bandwidth**: ${this.formatBytes(this.metrics.bandwidth.avgBandwidthPerSecond)}/sec
- **Peak Bandwidth**: ${this.formatBytes(this.metrics.bandwidth.peakBandwidth)}
- **Network Utilization**: ${this.metrics.bandwidth.networkUtilization.toFixed(4)}%

## Success Metrics
- **Successful Operations**: ${this.metrics.successfulOperations}
- **Failed Operations**: ${this.metrics.failedOperations}
- **Success Rate**: ${this.metrics.successRate.toFixed(2)}%

## System Resources
- **Memory Usage**:
  - RSS: ${(this.metrics.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
  - Heap Used: ${(this.metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
  - Heap Total: ${(this.metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
  - External: ${(this.metrics.memoryUsage.external / 1024 / 1024).toFixed(2)} MB
- **CPU Info**: ${os.cpus().length} cores, ${os.cpus()[0].model}
- **Platform**: ${os.platform()} ${os.arch()}
- **Load Average**: ${os.loadavg().map(load => load.toFixed(2)).join(', ')}

## Performance Analysis
${this.generatePerformanceAnalysis()}

## Response Time Distribution
${this.generateResponseTimeDistribution()}

## Bandwidth Analysis
${this.generateBandwidthAnalysis()}

---
*Load test completed at ${new Date().toISOString()}*
`;

    return report;
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generatePerformanceAnalysis(): string {
    const { messagesPerSecond, avgResponseTime, successRate } = this.metrics;
    
    let analysis = "";
    
    if (messagesPerSecond > 100) {
      analysis += "✅ **Excellent throughput** - System handles high message volume efficiently\n";
    } else if (messagesPerSecond > 50) {
      analysis += "✅ **Good throughput** - System performs well under load\n";
    } else {
      analysis += "⚠️ **Low throughput** - Consider optimizing database operations\n";
    }
    
    if (avgResponseTime < 100) {
      analysis += "✅ **Fast response times** - Users will experience smooth messaging\n";
    } else if (avgResponseTime < 500) {
      analysis += "✅ **Acceptable response times** - Performance is adequate\n";
    } else {
      analysis += "⚠️ **Slow response times** - May impact user experience\n";
    }
    
    if (successRate >= 99) {
      analysis += "✅ **Excellent reliability** - System handles concurrent load very well\n";
    } else if (successRate >= 95) {
      analysis += "✅ **Good reliability** - Minimal failures under load\n";
    } else {
      analysis += "❌ **Poor reliability** - High failure rate needs investigation\n";
    }
    
    return analysis;
  }

  private generateResponseTimeDistribution(): string {
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

    return `
- **P50 (Median)**: ${p50}ms
- **P90**: ${p90}ms  
- **P95**: ${p95}ms
- **P99**: ${p99}ms
`;
  }

  private generateBandwidthAnalysis(): string {
    const { bandwidth } = this.metrics;
    let analysis = "";
    
    if (bandwidth.avgBandwidthPerSecond > 50 * 1024 * 1024) { // > 50MB/s
      analysis += "🚀 **High bandwidth usage** - System handles large media files efficiently\n";
    } else if (bandwidth.avgBandwidthPerSecond > 10 * 1024 * 1024) { // > 10MB/s
      analysis += "✅ **Moderate bandwidth usage** - Good performance for mixed media\n";
    } else {
      analysis += "📊 **Low bandwidth usage** - Primarily text-based communication\n";
    }
    
    if (bandwidth.networkUtilization < 1) {
      analysis += "✅ **Excellent network efficiency** - Very low network utilization\n";
    } else if (bandwidth.networkUtilization < 10) {
      analysis += "✅ **Good network efficiency** - Reasonable network utilization\n";
    } else {
      analysis += "⚠️ **High network utilization** - May need bandwidth optimization\n";
    }
    
    // Data distribution analysis
    const totalData = bandwidth.totalDataTransferred;
    const videoPercentage = (bandwidth.videoDataTransferred / totalData) * 100;
    const voicePercentage = (bandwidth.voiceDataTransferred / totalData) * 100;
    const chatPercentage = (bandwidth.chatDataTransferred / totalData) * 100;
    
    analysis += `\n**Data Distribution:**\n`;
    analysis += `- Video: ${videoPercentage.toFixed(1)}% (${this.formatBytes(bandwidth.videoDataTransferred)})\n`;
    analysis += `- Voice: ${voicePercentage.toFixed(1)}% (${this.formatBytes(bandwidth.voiceDataTransferred)})\n`;
    analysis += `- Chat: ${chatPercentage.toFixed(1)}% (${this.formatBytes(bandwidth.chatDataTransferred)})\n`;
    
    return analysis;
  }

  private async saveReport(report: string): Promise<void> {
    const docsDir = path.join(process.cwd(), "docs");
    const reportPath = path.join(docsDir, `load-test-report-${Date.now()}.md`);
    
    try {
      // Ensure docs directory exists
      await fs.mkdir(docsDir, { recursive: true });
      
      // Save the report
      await fs.writeFile(reportPath, report, 'utf8');
      this.log(`Load test report saved to: ${reportPath}`);
    } catch (error) {
      this.log(`Failed to save report: ${error}`);
    }
  }

  private async cleanupTestData(): Promise<void> {
    this.log("Cleaning up test data...");
    
    try {
      // Delete test sessions
      if (this.testSessionIds.length > 0) {
        await db.delete(sessions).where(inArray(sessions.id, this.testSessionIds));
        this.log(`Deleted ${this.testSessionIds.length} test sessions`);
      }
      
      // Delete test messages
      if (this.testMessageIds.length > 0) {
        await db.delete(messages).where(inArray(messages.id, this.testMessageIds));
        this.log(`Deleted ${this.testMessageIds.length} test messages`);
      }
      
      // Delete test users
      if (this.testUserIds.length > 0) {
        await db.delete(users).where(inArray(users.id, this.testUserIds));
        this.log(`Deleted ${this.testUserIds.length} test users`);
      }
      
      this.log("✅ Test data cleanup completed successfully");
    } catch (error) {
      this.log(`❌ Error during cleanup: ${error}`);
      throw error;
    }
  }

  public async runLoadTest(): Promise<void> {
    try {
      this.log("🚀 Starting Load Test: 50 Concurrent Users Multi-Modal Communication");
      this.log("=" .repeat(70));
      
      // Phase 1: Setup
      await this.createTestUsers();
      
      // Phase 2: Execute load test
      await this.runConcurrentMessaging();
      
      // Phase 3: Calculate metrics
      this.calculateMetrics();
      
      // Phase 4: Generate and save report
      const report = await this.generateReport();
      await this.saveReport(report);
      
      // Phase 5: Cleanup
      await this.cleanupTestData();
      
      this.log("=" .repeat(70));
      this.log("✅ Load test completed successfully!");
      this.log(`📊 Messages: ${this.metrics.totalMessages} (${this.metrics.chatMessages}C/${this.metrics.voiceMessages}V/${this.metrics.videoMessages}Vid), Sessions: ${this.metrics.totalSessions}`);
      this.log(`🚀 Performance: ${this.metrics.messagesPerSecond.toFixed(2)} msg/sec, ${this.formatBytes(this.metrics.bandwidth.avgBandwidthPerSecond)}/sec, ${this.metrics.successRate.toFixed(2)}% success`);
      
    } catch (error) {
      this.log(`❌ Load test failed: ${error}`);
      
      // Attempt cleanup even if test failed
      try {
        await this.cleanupTestData();
      } catch (cleanupError) {
        this.log(`❌ Cleanup also failed: ${cleanupError}`);
      }
      
      throw error;
    }
  }
}

// Execute the load test
async function main() {
  const loadTester = new LoadTester();
  await loadTester.runLoadTest();
  process.exit(0);
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Load test interrupted. Attempting cleanup...');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Load test terminated. Attempting cleanup...');
  process.exit(1);
});

// Run the test if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this file is being run directly
if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

export default main;