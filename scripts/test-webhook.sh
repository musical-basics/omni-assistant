#!/bin/bash
# Smoke test: send a fake incoming message
curl -X POST http://localhost:3000/api/webhooks/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test-chat-001",
    "platform": "iMessage",
    "contactName": "Test User",
    "sender": "them",
    "content": "hey what are you up to this week?"
  }'
