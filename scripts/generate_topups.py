#!/usr/bin/env python3

import sys
from python_data_generator import get_db_connection, generate_topups

def run_topups_generator():
    try:
        conn = get_db_connection()
        
        print("Generating topup transactions...")
        
        # Generate topup transactions
        generate_topups(conn, 30)
        
        print("Topup generation complete!")
        conn.close()
    except Exception as e:
        print(f"Error in topup generation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_topups_generator()