#!/usr/bin/env python3

import sys
from python_data_generator import get_db_connection, generate_reviews, generate_conversations, generate_messages, generate_topups

def run_specific_generators():
    try:
        conn = get_db_connection()
        
        print("Starting specific data generation...")
        
        # Generate more messages
        generate_messages(conn, 200)
        
        # Generate reviews for existing sessions
        generate_reviews(conn)
        
        # Generate Angela AI conversations
        generate_conversations(conn, 30)
        
        # Generate topup transactions
        generate_topups(conn, 30)
        
        print("Specific data generation complete!")
        conn.close()
    except Exception as e:
        print(f"Error in data generation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_specific_generators()