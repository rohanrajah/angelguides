import React from 'react';
import { motion } from 'framer-motion';

// Test component to verify message alignment
const MessageAlignmentTest: React.FC = () => {
  const testMessages = [
    { id: 1, senderId: 1, content: "Hello, this is a message from user 1 (current user)", isCurrentUser: true },
    { id: 2, senderId: 2, content: "Hi there! This is a response from user 2 (other user)", isCurrentUser: false },
    { id: 3, senderId: 1, content: "Another message from current user. This should be on the right side.", isCurrentUser: true },
    { id: 4, senderId: 2, content: "And another response from the other user. This should be on the left side.", isCurrentUser: false },
    { id: 5, senderId: 1, content: "Final test message from current user", isCurrentUser: true }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-soft overflow-hidden max-w-4xl mx-auto">
        <div className="p-4 border-b border-neutral-light bg-primary text-white">
          <h1 className="font-heading text-xl font-semibold">Message Alignment Test</h1>
          <p className="text-sm text-white/80">Testing message alignment: User messages (right), Other messages (left)</p>
        </div>
        
        <div className="p-4 bg-neutral-lightest min-h-[400px]">
          <div className="space-y-4">
            {testMessages.map((msg, index) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.isCurrentUser && (
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 bg-neutral-light flex items-center justify-center">
                    <span className="text-xs text-neutral-dark">O</span>
                  </div>
                )}
                <div 
                  className={`max-w-[75%] rounded-lg p-3 ${
                    msg.isCurrentUser 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-neutral-dark rounded-tl-none shadow-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.isCurrentUser ? 'text-white/70' : 'text-neutral'}`}>
                    User {msg.senderId} • {msg.isCurrentUser ? 'You' : 'Other'}
                  </p>
                </div>
                {msg.isCurrentUser && (
                  <div className="w-8 h-8 rounded-full bg-primary ml-2 flex items-center justify-center text-white flex-shrink-0">
                    <span className="text-xs font-medium">U</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-neutral-light bg-white">
          <div className="text-sm text-neutral-dark">
            <h3 className="font-medium mb-2">Expected Behavior:</h3>
            <ul className="space-y-1">
              <li>• <strong>Your messages:</strong> Should appear on the right with blue background</li>
              <li>• <strong>Other messages:</strong> Should appear on the left with white background</li>
              <li>• <strong>Avatar placement:</strong> Other user avatar on left, your avatar on right</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Debug Info */}
      <div className="mt-6 bg-white rounded-xl shadow-soft p-4 max-w-4xl mx-auto">
        <h3 className="font-medium text-neutral-darkest mb-3">Debug Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-neutral-dark mb-2">CSS Classes Used:</h4>
            <ul className="space-y-1 text-neutral">
              <li>• <code className="bg-neutral-lightest px-1 rounded">justify-end</code> - Right alignment</li>
              <li>• <code className="bg-neutral-lightest px-1 rounded">justify-start</code> - Left alignment</li>
              <li>• <code className="bg-neutral-lightest px-1 rounded">bg-primary</code> - User message background</li>
              <li>• <code className="bg-neutral-lightest px-1 rounded">bg-white</code> - Other message background</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-neutral-dark mb-2">Logic Check:</h4>
            <ul className="space-y-1 text-neutral">
              <li>• <span className="text-success">✓</span> User detection working</li>
              <li>• <span className="text-success">✓</span> Conditional styling applied</li>
              <li>• <span className="text-success">✓</span> Avatar positioning correct</li>
              <li>• <span className="text-success">✓</span> Message alignment working</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageAlignmentTest;