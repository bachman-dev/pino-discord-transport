# @bachman-dev/pino-discord-transport

Use this transport with pino to send logs to a Discord webhook

## Usage

```shell
pnpm install @bachman-dev/pino-discord-transport
```

In your project:

```ts
pino({
  transport: {
    targets: [
      {
        target: "pino/file",
        options: {
          // Write to STDOUT
          destination: 1,
        },
      },
      {
        level: "warn",
        target: "@bachman-dev/pino-discord-transport",
        options: {
          webhookUrl: process.env.DISCORD_WEBHOOK_URL,
          // optionally mention a user in the message
          messageId: process.env.DISCORD_WEBHOOK_MENTION_ID,
        },
      },
    ],
  },
});
```
