#!/usr/bin/env python3

import os
import sys
import random
import psycopg2
import json
from psycopg2.extras import execute_values
from faker import Faker
from datetime import datetime, timedelta

# Initialize Faker
faker = Faker()

# PostgreSQL connection using environment variables
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.environ.get('PGDATABASE'),
            user=os.environ.get('PGUSER'),
            password=os.environ.get('PGPASSWORD'),
            host=os.environ.get('PGHOST'),
            port=os.environ.get('PGPORT')
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

# User type enum values (must match schema.ts values)
class UserType:
    USER = 'user'
    ADVISOR = 'advisor'
    ADMIN = 'admin'

# Specialty categories (must match schema.ts values)
class SpecialtyCategory:
    DIVINATION = 'divination'
    HEALING = 'healing'
    SPIRITUAL_GUIDANCE = 'spiritual-guidance'
    MEDIUM = 'mediumship'
    ASTROLOGY = 'astrology'
    DREAM_INTERPRETATION = 'dream-interpretation'
    ENERGY_WORK = 'energy-work'
    PAST_LIVES = 'past-lives'
    CHANNELING = 'channeling'
    GENERAL = 'general'

# Session types
class SessionType:
    CHAT = 'chat'
    AUDIO = 'audio'
    VIDEO = 'video'

# Transaction types
class TransactionType:
    SESSION_PAYMENT = 'session_payment'
    ADVISOR_PAYOUT = 'advisor_payout'
    USER_TOPUP = 'user_topup'

# Generate specialties for the database
def generate_specialties(conn):
    print("Generating specialties...")
    
    specialty_list = [
        {"name": "Tarot Reading", "icon": "tarot", "category": SpecialtyCategory.DIVINATION},
        {"name": "Palm Reading", "icon": "palm", "category": SpecialtyCategory.DIVINATION},
        {"name": "Astrology", "icon": "stars", "category": SpecialtyCategory.ASTROLOGY},
        {"name": "Energy Healing", "icon": "energy", "category": SpecialtyCategory.HEALING},
        {"name": "Chakra Alignment", "icon": "chakra", "category": SpecialtyCategory.ENERGY_WORK},
        {"name": "Spirit Communication", "icon": "spirit", "category": SpecialtyCategory.MEDIUM},
        {"name": "Angel Guidance", "icon": "angel", "category": SpecialtyCategory.SPIRITUAL_GUIDANCE},
        {"name": "Dream Interpretation", "icon": "dream", "category": SpecialtyCategory.DREAM_INTERPRETATION},
        {"name": "Past Life Reading", "icon": "pastlife", "category": SpecialtyCategory.PAST_LIVES},
        {"name": "Numerology", "icon": "numbers", "category": SpecialtyCategory.DIVINATION},
        {"name": "Crystal Healing", "icon": "crystal", "category": SpecialtyCategory.HEALING},
        {"name": "Aura Reading", "icon": "aura", "category": SpecialtyCategory.ENERGY_WORK},
        {"name": "Spiritual Counseling", "icon": "counsel", "category": SpecialtyCategory.SPIRITUAL_GUIDANCE},
        {"name": "Reiki", "icon": "reiki", "category": SpecialtyCategory.HEALING},
        {"name": "Channeling", "icon": "channel", "category": SpecialtyCategory.CHANNELING},
        {"name": "Mediumship", "icon": "medium", "category": SpecialtyCategory.MEDIUM},
        {"name": "Natal Chart Reading", "icon": "natalchart", "category": SpecialtyCategory.ASTROLOGY},
        {"name": "Shamanic Healing", "icon": "shamanic", "category": SpecialtyCategory.HEALING},
        {"name": "Akashic Records", "icon": "akashic", "category": SpecialtyCategory.PAST_LIVES},
        {"name": "Sound Healing", "icon": "sound", "category": SpecialtyCategory.HEALING}
    ]

    cursor = conn.cursor()
    try:
        # Check existing specialties
        cursor.execute("SELECT name FROM specialties")
        existing_specialties = {row[0] for row in cursor.fetchall()}
        
        # Filter out existing specialties
        new_specialties = [s for s in specialty_list if s["name"] not in existing_specialties]
        
        if new_specialties:
            values = [(s["name"], s["icon"], s["category"]) for s in new_specialties]
            execute_values(
                cursor,
                "INSERT INTO specialties (name, icon, category) VALUES %s RETURNING id",
                values
            )
            conn.commit()
            print(f"Created {len(new_specialties)} new specialties.")
        else:
            print("No new specialties to create - all already exist.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating specialties: {e}")
    finally:
        cursor.close()

# Generate a random selection of specialty IDs
def generate_random_specialties(count=3):
    max_count = min(count, 20)
    specialty_ids = random.sample(range(1, 21), max_count)
    return specialty_ids

# Generate a random bio for advisors
def generate_random_bio():
    intros = [
        "I am a gifted spiritual advisor with over",
        "I've been practicing spiritual healing for",
        "With a natural talent for psychic readings and",
        "I discovered my spiritual gifts",
        "My journey into the spiritual realm began",
        "I have been blessed with the ability to connect with spirits for"
    ]
    
    years = random.randint(3, 30)
    
    skills = [
        "tarot readings",
        "energy healing",
        "aura cleansing",
        "spiritual guidance",
        "angel communication",
        "past life regression",
        "astral projection guidance",
        "chakra alignment",
        "crystal healing",
        "mediumship",
        "clairvoyance",
        "empathic healing"
    ]
    
    promises = [
        "I promise to guide you on your spiritual journey with compassion and wisdom.",
        "My goal is to help you find clarity and peace in your life.",
        "I'm here to connect you with your higher self and spiritual guides.",
        "Let me help you discover your true path and purpose.",
        "I can help you heal from past wounds and embrace your future.",
        "Together, we'll unlock the spiritual insights you've been seeking."
    ]
    
    return f"{random.choice(intros)} {years} years. I specialize in {random.choice(skills)} and {random.choice(skills)}. {random.choice(promises)}"

# Generate users for the database
def generate_users(conn, count=100):
    print(f"Generating {count} regular users...")
    
    cursor = conn.cursor()
    try:
        # Check existing users
        cursor.execute("SELECT username FROM users WHERE user_type = %s", (UserType.USER,))
        existing_usernames = {row[0] for row in cursor.fetchall()}
        
        # Create users that don't exist yet
        users_created = 0
        for i in range(count):
            username = f"user{i+1}"
            
            # Skip if user already exists
            if username in existing_usernames:
                continue
                
            name = faker.name()
            password = f"password{i+1}" # In production, these would be hashed
            
            cursor.execute(
                """
                INSERT INTO users (
                    username, password, name, email, phone, user_type, is_advisor, bio, 
                    profile_completed, account_balance
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    username, 
                    password, 
                    name, 
                    faker.email(),
                    faker.phone_number(),
                    UserType.USER,
                    False,
                    "Regular user account",
                    True,
                    random.randint(0, 10000) if random.random() > 0.7 else 0
                )
            )
            users_created += 1
            
            # Commit in batches to avoid holding transaction too long
            if users_created % 10 == 0:
                conn.commit()
        
        conn.commit()
        print(f"Created {users_created} new regular users.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating users: {e}")
    finally:
        cursor.close()

# Generate advisors for the database
def generate_advisors(conn, count=50):
    print(f"Generating {count} advisors...")
    
    cursor = conn.cursor()
    try:
        # Check existing advisors
        cursor.execute("SELECT username FROM users WHERE user_type = %s", (UserType.ADVISOR,))
        existing_usernames = {row[0] for row in cursor.fetchall()}
        
        # Create advisors that don't exist yet
        advisors_created = 0
        for i in range(count):
            username = f"advisor{i+101}" # Start from 101 to not overlap with users
            
            # Skip if advisor already exists
            if username in existing_usernames:
                continue
                
            name = faker.name()
            password = f"password{i+101}" # In production, these would be hashed
            
            chat_rate = random.randint(100, 500) # $1-$5 per minute
            audio_rate = chat_rate + random.randint(50, 150) # A bit more than chat
            video_rate = audio_rate + random.randint(100, 300) # A bit more than audio
            
            rating = random.randint(35, 50) # 3.5 to 5.0 stars (stored as 35 to 50)
            review_count = random.randint(5, 100)
            
            specialties = generate_random_specialties(random.randint(2, 5))
            
            cursor.execute(
                """
                INSERT INTO users (
                    username, password, name, email, phone, user_type, is_advisor, 
                    bio, specialties, profile_completed, chat_rate, audio_rate, video_rate,
                    rating, review_count, online, earnings_balance, total_earnings
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING id
                """,
                (
                    username, 
                    password, 
                    name, 
                    faker.email(),
                    faker.phone_number(),
                    UserType.ADVISOR,
                    True,
                    generate_random_bio(),
                    json.dumps(specialties),
                    True,
                    chat_rate,
                    audio_rate,
                    video_rate,
                    rating,
                    review_count,
                    random.random() > 0.7, # 30% chance of being online
                    random.randint(5000, 50000) if random.random() > 0.7 else 0,
                    random.randint(10000, 100000) if random.random() > 0.5 else 0
                )
            )
            advisor_id = cursor.fetchone()[0]
            
            # Insert advisor specialties
            for specialty_id in specialties:
                try:
                    cursor.execute(
                        "INSERT INTO advisor_specialties (advisor_id, specialty_id) VALUES (%s, %s)",
                        (advisor_id, specialty_id)
                    )
                except Exception as e:
                    # Ignore duplicate advisor-specialty mappings
                    if "duplicate key" not in str(e):
                        raise
            
            advisors_created += 1
            
            # Commit in batches to avoid holding transaction too long
            if advisors_created % 5 == 0:
                conn.commit()
        
        conn.commit()
        print(f"Created {advisors_created} new advisors with their specialties.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating advisors: {e}")
    finally:
        cursor.close()

# Generate admins for the database
def generate_admins(conn, count=2):
    print(f"Generating {count} admins...")
    
    cursor = conn.cursor()
    try:
        # Check existing admins
        cursor.execute("SELECT username FROM users WHERE user_type = %s", (UserType.ADMIN,))
        existing_usernames = {row[0] for row in cursor.fetchall()}
        
        # Create admins that don't exist yet
        admins_created = 0
        for i in range(count):
            username = f"admin{i+1}"
            
            # Skip if admin already exists
            if username in existing_usernames:
                continue
                
            name = faker.name()
            password = f"admin{i+1}pass" # In production, these would be hashed
            
            cursor.execute(
                """
                INSERT INTO users (
                    username, password, name, email, phone, user_type, is_advisor, bio, profile_completed
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    username, 
                    password, 
                    name, 
                    f"admin{i+1}@angelguides.ai",
                    faker.phone_number(),
                    UserType.ADMIN,
                    False,
                    "Administrator account",
                    True
                )
            )
            admins_created += 1
        
        conn.commit()
        print(f"Created {admins_created} new admins.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating admins: {e}")
    finally:
        cursor.close()

# Generate session data
def generate_sessions(conn, count=200):
    print(f"Generating {count} sessions...")
    
    cursor = conn.cursor()
    try:
        # Get all users and advisors
        cursor.execute("SELECT id FROM users WHERE user_type = %s", (UserType.USER,))
        user_ids = [row[0] for row in cursor.fetchall()]
        
        cursor.execute("SELECT id, chat_rate, audio_rate, video_rate FROM users WHERE user_type = %s", (UserType.ADVISOR,))
        advisors = [(row[0], row[1], row[2], row[3]) for row in cursor.fetchall()]
        
        if not user_ids or not advisors:
            print("No users or advisors found. Skipping session generation.")
            return
            
        # Generate session data
        sessions_created = 0
        transactions_created = 0
        now = datetime.now()
        
        for i in range(count):
            user_id = random.choice(user_ids)
            advisor_id, chat_rate, audio_rate, video_rate = random.choice(advisors)
            
            # Random date in the past 30 days
            days_ago = random.randint(0, 30)
            start_time = now - timedelta(days=days_ago, hours=random.randint(0, 23))
            
            # Random duration between 15 and 90 minutes
            duration_minutes = random.randint(15, 90)
            end_time = start_time + timedelta(minutes=duration_minutes)
            
            # Random session type
            session_type = random.choice([SessionType.CHAT, SessionType.AUDIO, SessionType.VIDEO])
            
            # Determine rate based on session type
            if session_type == SessionType.CHAT:
                rate = chat_rate
            elif session_type == SessionType.AUDIO:
                rate = audio_rate
            else:
                rate = video_rate
            
            # Determine status
            if days_ago > 7:
                status = "completed"
                actual_start_time = start_time
                actual_end_time = end_time
                actual_duration = duration_minutes
                billed_amount = rate * duration_minutes
                is_paid = random.random() > 0.3  # 70% chance it's paid
            elif days_ago > 2:
                status = random.choice(["completed", "canceled"])
                if status == "completed":
                    actual_start_time = start_time
                    actual_end_time = end_time
                    actual_duration = duration_minutes
                    billed_amount = rate * duration_minutes
                    is_paid = random.random() > 0.5
                else:
                    actual_start_time = None
                    actual_end_time = None
                    actual_duration = None
                    billed_amount = None
                    is_paid = False
            else:
                status = random.choice(["scheduled", "in_progress"])
                if status == "in_progress":
                    actual_start_time = start_time
                    actual_end_time = None
                    actual_duration = None
                    billed_amount = None
                    is_paid = False
                else:
                    actual_start_time = None
                    actual_end_time = None
                    actual_duration = None
                    billed_amount = None
                    is_paid = False
            
            try:
                cursor.execute(
                    """
                    INSERT INTO sessions (
                        user_id, advisor_id, start_time, end_time, session_type, status, notes,
                        rate_per_minute, actual_start_time, actual_end_time, actual_duration,
                        billed_amount, is_paid
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) RETURNING id
                    """,
                    (
                        user_id,
                        advisor_id,
                        start_time,
                        end_time,
                        session_type,
                        status,
                        faker.text(max_nb_chars=200) if random.random() > 0.7 else None,
                        rate,
                        actual_start_time,
                        actual_end_time,
                        actual_duration,
                        billed_amount,
                        is_paid
                    )
                )
                
                sessions_created += 1
                
                # Generate transaction for completed sessions that have been paid
                if status == "completed" and billed_amount and is_paid:
                    session_id = cursor.fetchone()[0]
                    cursor.execute(
                        """
                        INSERT INTO transactions (
                            type, user_id, advisor_id, session_id, amount, description, payment_status
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s
                        )
                        """,
                        (
                            TransactionType.SESSION_PAYMENT,
                            user_id,
                            advisor_id,
                            session_id,
                            -billed_amount,  # Negative for user (payment)
                            f"Payment for {session_type} session with advisor #{advisor_id}",
                            "completed"
                        )
                    )
                    transactions_created += 1
                
                # Commit in batches to avoid long transaction
                if sessions_created % 20 == 0:
                    conn.commit()
                    
            except Exception as e:
                # Continue with the next session if this one fails
                if "duplicate key" in str(e):
                    continue
                else:
                    raise
        
        conn.commit()
        print(f"Created {sessions_created} sessions with {transactions_created} related transactions.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating sessions: {e}")
    finally:
        cursor.close()

# Generate messages between users and advisors
def generate_messages(conn, count=500):
    print(f"Generating {count} messages...")
    
    cursor = conn.cursor()
    try:
        # Get all users and advisors
        cursor.execute("SELECT id FROM users WHERE user_type = %s", (UserType.USER,))
        user_ids = [row[0] for row in cursor.fetchall()]
        
        cursor.execute("SELECT id FROM users WHERE user_type = %s", (UserType.ADVISOR,))
        advisor_ids = [row[0] for row in cursor.fetchall()]
        
        if not user_ids or not advisor_ids:
            print("No users or advisors found. Skipping message generation.")
            return
            
        # Generate message pairs (user to advisor and responses)
        now = datetime.now()
        
        # Create user-advisor pairs for messaging
        pairs = []
        for _ in range(min(len(user_ids), len(advisor_ids), 30)):
            user_id = random.choice(user_ids)
            advisor_id = random.choice(advisor_ids)
            pairs.append((user_id, advisor_id))
        
        # Insert messages
        messages_created = 0
        
        for user_id, advisor_id in pairs:
            # Random number of messages in this thread
            thread_count = min(random.randint(3, 20), count - messages_created)
            if thread_count <= 0:
                break
                
            for i in range(thread_count):
                # Alternate between user and advisor
                if i % 2 == 0:
                    sender_id = user_id
                    receiver_id = advisor_id
                    content = faker.text(max_nb_chars=100)
                else:
                    sender_id = advisor_id
                    receiver_id = user_id
                    content = faker.text(max_nb_chars=150)
                
                # Random timestamp in the past week
                message_time = now - timedelta(
                    days=random.randint(0, 7),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                
                # Messages from longer ago are more likely to be read
                read = True if message_time < (now - timedelta(days=1)) else random.random() > 0.5
                
                try:
                    cursor.execute(
                        """
                        INSERT INTO messages (
                            sender_id, receiver_id, content, timestamp, read
                        ) VALUES (
                            %s, %s, %s, %s, %s
                        )
                        """,
                        (
                            sender_id,
                            receiver_id,
                            content,
                            message_time,
                            read
                        )
                    )
                    messages_created += 1
                    
                    # Commit in batches
                    if messages_created % 50 == 0:
                        conn.commit()
                        
                except Exception as e:
                    # Just continue if this message fails
                    if "duplicate key" in str(e):
                        continue
                    else:
                        raise
        
        conn.commit()
        print(f"Created {messages_created} messages.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating messages: {e}")
    finally:
        cursor.close()

# Generate reviews for completed sessions
def generate_reviews(conn):
    print("Generating reviews for completed sessions...")
    
    cursor = conn.cursor()
    try:
        # Get all completed sessions
        cursor.execute(
            "SELECT id, user_id, advisor_id FROM sessions WHERE status = %s",
            ("completed",)
        )
        sessions = cursor.fetchall()
        
        if not sessions:
            print("No completed sessions found. Skipping review generation.")
            return
            
        # Check for existing reviews to avoid duplicates
        cursor.execute("SELECT session_id FROM reviews")
        existing_session_reviews = {row[0] for row in cursor.fetchall()}
        
        # Generate reviews for some of the sessions
        reviews_count = 0
        for session_id, user_id, advisor_id in sessions:
            # Skip if session already has a review
            if session_id in existing_session_reviews:
                continue
                
            # 70% chance of having a review
            if random.random() > 0.3:
                try:
                    # Rating between 3-5 stars, weighted toward higher ratings
                    rating = random.choices([3, 4, 5], weights=[1, 3, 6])[0]
                    
                    # Content more likely for higher ratings
                    has_content = random.random() > (0.6 - (rating * 0.1))
                    content = faker.paragraph() if has_content else None
                    
                    # Reviews from longer ago are more likely to have advisor responses
                    has_response = random.random() > 0.6
                    response = faker.paragraph() if has_response else None
                    response_date = datetime.now() - timedelta(days=random.randint(0, 10)) if has_response else None
                    
                    cursor.execute(
                        """
                        INSERT INTO reviews (
                            user_id, advisor_id, session_id, rating, content, created_at,
                            response, response_date, is_hidden
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        """,
                        (
                            user_id,
                            advisor_id,
                            session_id,
                            rating,
                            content,
                            datetime.now() - timedelta(days=random.randint(0, 30)),
                            response,
                            response_date,
                            random.random() < 0.05  # 5% chance of being hidden
                        )
                    )
                    reviews_count += 1
                    
                    # Commit in batches
                    if reviews_count % 20 == 0:
                        conn.commit()
                        
                except Exception as e:
                    # Continue with next review if this one fails
                    if "duplicate key" in str(e):
                        continue
                    else:
                        raise
        
        conn.commit()
        
        if reviews_count > 0:
            # Update advisor ratings based on reviews
            try:
                cursor.execute(
                    """
                    UPDATE users u
                    SET 
                        rating = subquery.avg_rating,
                        review_count = subquery.review_count
                    FROM (
                        SELECT 
                            advisor_id, 
                            COUNT(*) as review_count,
                            CAST(AVG(rating) * 10 AS INTEGER) as avg_rating
                        FROM reviews
                        GROUP BY advisor_id
                    ) as subquery
                    WHERE u.id = subquery.advisor_id
                    """
                )
                conn.commit()
            except Exception as e:
                print(f"Warning: Failed to update advisor ratings: {e}")
                # Continue anyway
                
        print(f"Created {reviews_count} reviews and updated advisor ratings.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating reviews: {e}")
    finally:
        cursor.close()

# Generate AI conversations with Angela
def generate_conversations(conn, count=50):
    print(f"Generating {count} Angela AI conversations...")
    
    cursor = conn.cursor()
    try:
        # Get user IDs
        cursor.execute("SELECT id FROM users WHERE user_type = %s", (UserType.USER,))
        user_ids = [row[0] for row in cursor.fetchall()]
        
        if not user_ids:
            print("No users found. Skipping Angela AI conversation generation.")
            return
            
        # Check existing conversations to avoid duplicates
        cursor.execute("SELECT user_id FROM conversations")
        existing_user_convos = {row[0] for row in cursor.fetchall()}
        
        # Sample some users for conversations
        available_users = [uid for uid in user_ids if uid not in existing_user_convos]
        selected_users = random.sample(available_users, min(count, len(available_users)))
        
        conversations_created = 0
        for user_id in selected_users:
            try:
                # Generate a conversation with 3-10 messages
                message_count = random.randint(3, 10)
                messages = []
                
                for i in range(message_count):
                    if i % 2 == 0:
                        role = "user"
                        content = faker.sentence()
                    else:
                        role = "assistant"
                        content = faker.paragraph()
                    
                    # Add timestamp to each message
                    timestamp = datetime.now() - timedelta(
                        days=random.randint(0, 14),
                        hours=random.randint(0, 23),
                        minutes=random.randint(0, 59)
                    )
                    
                    messages.append({
                        "role": role,
                        "content": content,
                        "timestamp": timestamp.isoformat()
                    })
                
                # Sort messages by timestamp
                messages.sort(key=lambda x: x["timestamp"])
                
                cursor.execute(
                    """
                    INSERT INTO conversations (
                        user_id, messages, last_updated
                    ) VALUES (
                        %s, %s, %s
                    )
                    """,
                    (
                        user_id,
                        json.dumps(messages),
                        datetime.now() - timedelta(days=random.randint(0, 14))
                    )
                )
                
                conversations_created += 1
                
                # Commit in batches
                if conversations_created % 10 == 0:
                    conn.commit()
                    
            except Exception as e:
                # Skip this conversation if it fails
                if "duplicate key" in str(e):
                    continue
                else:
                    raise
        
        conn.commit()
        print(f"Created {conversations_created} Angela AI conversations.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating conversations: {e}")
    finally:
        cursor.close()

# Generate topup transactions
def generate_topups(conn, count=50):
    print(f"Generating {count} topup transactions...")
    
    cursor = conn.cursor()
    try:
        # Get user IDs
        cursor.execute("SELECT id FROM users WHERE user_type = %s", (UserType.USER,))
        user_ids = [row[0] for row in cursor.fetchall()]
        
        if not user_ids:
            print("No users found. Skipping topup generation.")
            return
            
        # Sample some users for topups
        selected_users = random.sample(user_ids, min(count, len(user_ids)))
        
        topups_created = 0
        users_with_topups = 0
        
        for user_id in selected_users:
            user_topups = 0
            # Generate 1-3 topups per user
            topup_count = random.randint(1, 3)
            
            for _ in range(topup_count):
                try:
                    # Random topup amount between $10 and $200
                    amount = random.randint(1000, 20000)  # In cents
                    
                    # Random date in the past 60 days
                    topup_date = datetime.now() - timedelta(days=random.randint(0, 60))
                    
                    # Generate unique reference
                    payment_reference = f"top_{faker.uuid4()}"
                    
                    cursor.execute(
                        """
                        INSERT INTO transactions (
                            type, user_id, amount, description, timestamp, payment_status, payment_reference
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s
                        )
                        """,
                        (
                            TransactionType.USER_TOPUP,
                            user_id,
                            amount,
                            "Account balance topup",
                            topup_date,
                            "completed",
                            payment_reference
                        )
                    )
                    
                    topups_created += 1
                    user_topups += 1
                    
                    # Also update user account balance
                    cursor.execute(
                        """
                        UPDATE users
                        SET account_balance = account_balance + %s
                        WHERE id = %s
                        """,
                        (amount, user_id)
                    )
                    
                    # Commit in batches
                    if topups_created % 10 == 0:
                        conn.commit()
                        
                except Exception as e:
                    # Skip this topup if it fails
                    if "duplicate key" in str(e):
                        continue
                    else:
                        raise
            
            if user_topups > 0:
                users_with_topups += 1
        
        conn.commit()
        print(f"Created {topups_created} topup transactions for {users_with_topups} users.")
    except Exception as e:
        conn.rollback()
        print(f"Error generating topups: {e}")
    finally:
        cursor.close()

# Main function to generate all data
def generate_all_data():
    try:
        conn = get_db_connection()
        
        print("Starting data generation...")
        
        # Generate all the data types
        generate_specialties(conn)
        generate_users(conn, 100)
        generate_advisors(conn, 50)
        generate_admins(conn, 2)
        generate_sessions(conn, 200)
        generate_messages(conn, 500)
        generate_reviews(conn)
        generate_conversations(conn, 50)
        generate_topups(conn, 50)
        
        print("Data generation complete!")
        conn.close()
    except Exception as e:
        print(f"Error in data generation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    generate_all_data()