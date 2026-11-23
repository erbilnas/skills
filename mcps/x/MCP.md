---
name: x
description: "http: https://api.x.com/mcp"
source: plugin
transport: http
---

# x

http: https://api.x.com/mcp

## Config

Secrets redacted.

```json
{
  "type": "http",
  "url": "https://api.x.com/mcp",
  "auth": {
    "CLIENT_ID": "***",
    "scopes": [
      "tweet.read",
      "tweet.write",
      "users.read",
      "follows.read",
      "space.read",
      "mute.read",
      "like.read",
      "list.read",
      "list.write",
      "block.read",
      "block.write",
      "bookmark.read",
      "bookmark.write",
      "dm.read",
      "dm.write",
      "calls.read",
      "calls.write",
      "broadcast.read",
      "broadcast.write",
      "media.write",
      "developer.billing.write",
      "developer.write",
      "offline.access"
    ]
  }
}
```
