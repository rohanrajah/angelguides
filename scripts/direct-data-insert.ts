import { db } from '../server/db';
import { 
  users, 
  UserType, 
  specialties, 
  SpecialtyCategory, 
  sessions, 
  SessionType,
  messages,
  conversations,
  reviews,
  transactions,
  TransactionType,
  workingHours
} from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { hash } from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

async function insertSpecialties() {
  console.log("Inserting specialties...");
  
  const specialtiesList = [
    { name: "Tarot Reading", icon: "tarot-card", category: SpecialtyCategory.DIVINATION },
    { name: "Psychic Reading", icon: "crystal-ball", category: SpecialtyCategory.DIVINATION },
    { name: "Astrology", icon: "stars", category: SpecialtyCategory.ASTROLOGY },
    { name: "Numerology", icon: "numbers", category: SpecialtyCategory.DIVINATION },
    { name: "Energy Healing", icon: "energy", category: SpecialtyCategory.HEALING },
    { name: "Spiritual Guidance", icon: "spirit", category: SpecialtyCategory.SPIRITUAL_GUIDANCE },
    { name: "Mediumship", icon: "medium", category: SpecialtyCategory.MEDIUM },
    { name: "Dream Interpretation", icon: "dream", category: SpecialtyCategory.DREAM_INTERPRETATION },
    { name: "Past Life Reading", icon: "past-life", category: SpecialtyCategory.PAST_LIVES },
    { name: "Channeling", icon: "channel", category: SpecialtyCategory.CHANNELING },
  ];
  
  for (const specialty of specialtiesList) {
    try {
      await db.insert(specialties).values(specialty).onConflictDoNothing();
    } catch (error) {
      console.log(`Skipped duplicate specialty: ${specialty.name}`);
    }
  }
  
  console.log("Specialties inserted");
}

async function insertUsers() {
  console.log("Inserting users...");
  
  // Create 10 regular users
  for (let i = 1; i <= 10; i++) {
    const hashedPassword = await hashPassword(`user${i}pass`);
    await db.insert(users).values({
      username: `user${i}`,
      password: hashedPassword,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      userType: UserType.USER,
      isAdvisor: false,
      bio: `Regular user account ${i}`,
      accountBalance: Math.floor(Math.random() * 10000), // Random balance up to $100
      profileCompleted: true,
    }).onConflictDoNothing();
  }
  
  console.log("Regular users inserted");
  
  // Create 5 advisors
  for (let i = 1; i <= 5; i++) {
    const hashedPassword = await hashPassword(`advisor${i}pass`);
    await db.insert(users).values({
      username: `advisor${i}`,
      password: hashedPassword,
      name: `Advisor ${i}`,
      email: `advisor${i}@example.com`,
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      userType: UserType.ADVISOR,
      isAdvisor: true,
      bio: `Experienced spiritual advisor with expertise in various metaphysical practices. Advisor ${i} has been helping clients for over ${5 + i} years.`,
      chatRate: 99 + (i * 10), // Different rates for different advisors
      audioRate: 199 + (i * 15),
      videoRate: 299 + (i * 20),
      rating: Math.floor(3.5 + (Math.random() * 1.5)),
      reviewCount: Math.floor(5 + (Math.random() * 20)),
      specialties: JSON.stringify([i, i+1, i+2]), // Assign 3 specialties to each advisor
      online: Math.random() > 0.5, // Randomly online
      accountBalance: 0,
      earningsBalance: Math.floor(Math.random() * 50000), // Random earnings up to $500
      totalEarnings: Math.floor(50000 + Math.random() * 950000), // Random total earnings $500-$10,000
      profileCompleted: true,
    }).onConflictDoNothing();
  }
  
  console.log("Advisors inserted");
  
  // Create 2 admins
  for (let i = 1; i <= 2; i++) {
    const hashedPassword = await hashPassword(`admin${i}pass`);
    await db.insert(users).values({
      username: `admin${i}`,
      password: hashedPassword,
      name: `Admin ${i}`,
      email: `admin${i}@angelguides.ai`,
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      userType: UserType.ADMIN,
      isAdvisor: false,
      bio: "Administrator account",
      profileCompleted: true,
    }).onConflictDoNothing();
  }
  
  console.log("Admins inserted");
}

async function insertSessions() {
  console.log("Inserting sessions...");
  
  // Get user IDs
  const userResults = await db.select({ id: users.id }).from(users).where(eq(users.userType, UserType.USER));
  const userIds = userResults.map(user => user.id);
  
  // Get advisor IDs
  const advisorResults = await db.select({ id: users.id }).from(users).where(eq(users.userType, UserType.ADVISOR));
  const advisorIds = advisorResults.map(advisor => advisor.id);
  
  if (userIds.length === 0 || advisorIds.length === 0) {
    console.log("No users or advisors found. Skipping sessions.");
    return;
  }
  
  // Create 20 sessions with different statuses
  const sessionTypes = [SessionType.CHAT, SessionType.AUDIO, SessionType.VIDEO];
  const statuses = ["scheduled", "in_progress", "completed", "canceled"];
  
  for (let i = 0; i < 20; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const advisorId = advisorIds[Math.floor(Math.random() * advisorIds.length)];
    const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Random dates in the past 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30 + Math.floor(Math.random() * 60)); // 30-90 minute sessions
    
    const ratePerMinute = sessionType === SessionType.CHAT ? 99 : 
                         sessionType === SessionType.AUDIO ? 199 : 299;
    
    const actualStartTime = status === "completed" || status === "in_progress" ? startDate : null;
    const actualEndTime = status === "completed" ? endDate : null;
    
    const actualDuration = status === "completed" ? 
      Math.floor((endDate.getTime() - startDate.getTime()) / 60000) : null;
    
    const billedAmount = status === "completed" && actualDuration ? 
      actualDuration * ratePerMinute : null;
    
    await db.insert(sessions).values({
      userId,
      advisorId,
      startTime: startDate,
      endTime: endDate,
      sessionType,
      status,
      ratePerMinute,
      notes: `Session notes for session ${i+1}`,
      actualStartTime,
      actualEndTime,
      actualDuration,
      billedAmount,
      isPaid: status === "completed" && Math.random() > 0.3, // 70% of completed sessions are paid
    }).onConflictDoNothing();
  }
  
  console.log("Sessions inserted");
}

async function insertMessages() {
  console.log("Inserting messages...");
  
  // Get all user IDs
  const userResults = await db.select({ id: users.id }).from(users);
  const userIds = userResults.map(user => user.id);
  
  if (userIds.length === 0) {
    console.log("No users found. Skipping messages.");
    return;
  }
  
  // Create 50 messages between random users
  for (let i = 0; i < 50; i++) {
    const senderId = userIds[Math.floor(Math.random() * userIds.length)];
    let receiverId;
    
    // Make sure sender and receiver are different
    do {
      receiverId = userIds[Math.floor(Math.random() * userIds.length)];
    } while (senderId === receiverId);
    
    // Random date in the past week
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7));
    
    await db.insert(messages).values({
      senderId,
      receiverId,
      content: `Message ${i+1} from user ${senderId} to user ${receiverId}`,
      timestamp,
      read: Math.random() > 0.3, // 70% of messages are read
    }).onConflictDoNothing();
  }
  
  console.log("Messages inserted");
}

async function insertConversations() {
  console.log("Inserting Angela AI conversations...");
  
  // Get user IDs
  const userResults = await db.select({ id: users.id }).from(users).where(eq(users.userType, UserType.USER));
  const userIds = userResults.map(user => user.id);
  
  if (userIds.length === 0) {
    console.log("No users found. Skipping conversations.");
    return;
  }
  
  // Create 10 conversations with Angela AI
  for (let i = 0; i < 10; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    
    // Create a conversation with 3-6 messages
    const messageCount = 3 + Math.floor(Math.random() * 4);
    const conversationMessages = [];
    
    for (let j = 0; j < messageCount; j++) {
      const isUser = j % 2 === 0; // Alternate between user and assistant
      
      conversationMessages.push({
        role: isUser ? 'user' : 'assistant',
        content: isUser ? 
          `User message ${j/2 + 1} asking about spiritual guidance` : 
          `Angela AI response ${(j-1)/2 + 1} providing spiritual insights and support`,
        timestamp: new Date(Date.now() - (messageCount - j) * 60000), // Each message a minute apart
      });
    }
    
    await db.insert(conversations).values({
      userId,
      messages: JSON.stringify(conversationMessages),
      lastUpdated: new Date(),
    }).onConflictDoNothing();
  }
  
  console.log("Conversations inserted");
}

async function insertReviews() {
  console.log("Inserting reviews...");
  
  // Get completed sessions
  const completedSessions = await db.select().from(sessions).where(eq(sessions.status, "completed"));
  
  if (completedSessions.length === 0) {
    console.log("No completed sessions found. Skipping reviews.");
    return;
  }
  
  // Create reviews for 75% of completed sessions
  for (const session of completedSessions) {
    // Skip some sessions randomly
    if (Math.random() > 0.75) continue;
    
    const rating = 3 + Math.floor(Math.random() * 3); // Ratings 3-5
    
    await db.insert(reviews).values({
      userId: session.userId,
      advisorId: session.advisorId,
      sessionId: session.id,
      rating,
      content: `${rating} star review for the ${session.sessionType} session. The advisor was ${
        rating === 5 ? 'excellent' : rating === 4 ? 'very good' : 'good'
      } and provided helpful guidance.`,
      createdAt: new Date(session.actualEndTime!.getTime() + 1000 * 60 * 60 * 24), // 1 day after session
      isHidden: false,
    }).onConflictDoNothing();
  }
  
  console.log("Reviews inserted");
  
  // Update advisor ratings based on reviews
  const advisorIds = [...new Set(completedSessions.map(s => s.advisorId))];
  
  for (const advisorId of advisorIds) {
    const advisorReviews = await db.select().from(reviews).where(eq(reviews.advisorId, advisorId));
    
    if (advisorReviews.length > 0) {
      const totalRating = advisorReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = Math.round(totalRating / advisorReviews.length);
      
      await db.update(users)
        .set({ 
          rating: averageRating, 
          reviewCount: advisorReviews.length 
        })
        .where(eq(users.id, advisorId));
    }
  }
  
  console.log("Advisor ratings updated");
}

async function insertTransactions() {
  console.log("Inserting transactions...");
  
  // Get users and completed sessions
  const userResults = await db.select({ id: users.id }).from(users).where(eq(users.userType, UserType.USER));
  const userIds = userResults.map(user => user.id);
  
  const completedSessions = await db.select().from(sessions).where(eq(sessions.status, "completed"));
  
  if (userIds.length === 0) {
    console.log("No users found. Skipping transactions.");
    return;
  }
  
  // Create user topup transactions
  for (let i = 0; i < 15; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const amount = 1000 + Math.floor(Math.random() * 9000); // $10-$100
    
    // Random date in the past 30 days
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));
    
    await db.insert(transactions).values({
      type: TransactionType.USER_TOPUP,
      userId,
      amount,
      description: `Account topup of $${(amount/100).toFixed(2)}`,
      timestamp,
      paymentStatus: 'completed',
      paymentReference: `topup_${Date.now()}_${i}`,
    }).onConflictDoNothing();
  }
  
  console.log("User topup transactions inserted");
  
  // Create session payment transactions for completed sessions
  for (const session of completedSessions) {
    if (session.billedAmount) {
      await db.insert(transactions).values({
        type: TransactionType.SESSION_PAYMENT,
        userId: session.userId,
        advisorId: session.advisorId,
        sessionId: session.id,
        amount: -session.billedAmount, // Negative for payment
        description: `Payment for ${session.sessionType} session`,
        timestamp: session.actualEndTime!,
        paymentStatus: 'completed',
        paymentReference: `session_${session.id}`,
      }).onConflictDoNothing();
      
      // Create corresponding advisor payout transaction (70% of session amount)
      const payoutAmount = Math.floor(session.billedAmount * 0.7);
      
      await db.insert(transactions).values({
        type: TransactionType.ADVISOR_PAYOUT,
        userId: session.advisorId, // advisor is the user receiving the payout
        sessionId: session.id,
        amount: payoutAmount,
        description: `Earnings for ${session.sessionType} session`,
        timestamp: new Date(session.actualEndTime!.getTime() + 1000 * 60 * 60 * 24), // 1 day after session
        paymentStatus: session.isPaid ? 'completed' : 'pending',
        paymentReference: `payout_${session.id}`,
      }).onConflictDoNothing();
    }
  }
  
  console.log("Session payment and advisor payout transactions inserted");
}

async function insertWorkingHours() {
  console.log("Inserting working hours...");
  
  // Get advisor IDs
  const advisorResults = await db.select({ id: users.id }).from(users).where(eq(users.userType, UserType.ADVISOR));
  const advisorIds = advisorResults.map(advisor => advisor.id);
  
  if (advisorIds.length === 0) {
    console.log("No advisors found. Skipping working hours.");
    return;
  }
  
  // Create working hours for each advisor for the next 7 days
  for (const advisorId of advisorIds) {
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const isAvailable = Math.random() > 0.2; // 80% chance of being available
      
      if (isAvailable) {
        // Different start times between 8 AM and 12 PM
        const startHour = 8 + Math.floor(Math.random() * 4);
        // Different end times between 4 PM and 8 PM
        const endHour = 16 + Math.floor(Math.random() * 4);
        
        const startTime = `${startHour.toString().padStart(2, '0')}:00`;
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;
        
        await db.insert(workingHours).values({
          advisorId,
          date: dateStr,
          startTime,
          endTime,
          isAvailable,
        }).onConflictDoNothing();
      } else {
        // If not available, still insert a record but with isAvailable=false
        await db.insert(workingHours).values({
          advisorId,
          date: dateStr,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: false,
        }).onConflictDoNothing();
      }
    }
  }
  
  console.log("Working hours inserted");
}

async function populateDatabase() {
  try {
    console.log("Starting database population...");
    
    // Insert data in the correct order to maintain relationships
    await insertSpecialties();
    await insertUsers();
    await insertSessions();
    await insertMessages();
    await insertConversations();
    await insertReviews();
    await insertTransactions();
    await insertWorkingHours();
    
    console.log("Database population complete!");
  } catch (error) {
    console.error("Error populating database:", error);
  }
}

// Always run when executed directly in ES modules
populateDatabase();

export { populateDatabase };