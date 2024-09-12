import type { APIEmbed, RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";
import type { Transform } from "stream";
import build from "pino-abstract-transport";

interface PinoLog {
  level: LogLevel;
  msg: string;
  time: number;
  hostname?: string;
  pid?: string;
}

enum Colors {
  Blue = 0x3498db,
  Green = 0x57f287,
  Grey = 0x95a5a6,
  Orange = 0xe67e22,
  Red = 0xed4245,
  Yellow = 0xfee75c,
}

enum LogLevel {
  Trace = 10,
  Debug = 20,
  Info = 30,
  Warn = 40,
  // eslint-disable-next-line @typescript-eslint/no-shadow -- We're in an enum so it's okay
  Error = 50,
  Fatal = 60,
}

type MentionLevel = "debug" | "error" | "fatal" | "info" | "trace" | "warn";

function isPinoLog(value: unknown): value is PinoLog {
  return (
    typeof value === "object" &&
    value !== null &&
    "level" in value &&
    typeof value.level === "number" &&
    "msg" in value &&
    typeof value.msg === "string" &&
    "time" in value &&
    typeof value.time === "number"
  );
}

function shouldMention(logLevel: LogLevel, mentionLevel: MentionLevel | undefined): boolean {
  switch (mentionLevel) {
    case "trace":
      return logLevel >= LogLevel.Trace;
    case "debug":
      return logLevel >= LogLevel.Debug;
    case "info":
      return logLevel >= LogLevel.Info;
    case "warn":
      return logLevel >= LogLevel.Warn;
    case "error":
      return logLevel >= LogLevel.Error;
    case "fatal":
      return logLevel >= LogLevel.Fatal;
    default:
      return true;
  }
}

export default function createTransport(options: DiscordTransportOptions): build.OnUnknown & Transform {
  return build(async (logs) => {
    const { mentionId, mentionLevel, webhookUrl } = options;
    for await (const anyLog of logs) {
      const log = anyLog as unknown;
      if (isPinoLog(log)) {
        const { level, msg, time, hostname, pid } = log;
        const body: RESTPostAPIWebhookWithTokenJSONBody = {};
        const embed: APIEmbed = {
          fields: [],
        };
        switch (level) {
          case LogLevel.Trace:
            embed.color = Colors.Grey;
            embed.title = "Trace";
            break;
          case LogLevel.Debug:
            embed.color = Colors.Blue;
            embed.title = "Debug";
            break;
          case LogLevel.Info:
            embed.color = Colors.Green;
            embed.title = "Info";
            break;
          case LogLevel.Warn:
            embed.color = Colors.Yellow;
            embed.title = "Warn";
            break;
          case LogLevel.Error:
            embed.color = Colors.Orange;
            embed.title = "Error";
            break;
          case LogLevel.Fatal:
            embed.color = Colors.Red;
            embed.title = "FATAL";
        }
        embed.description = msg;
        if (typeof pid !== "undefined" || typeof hostname !== "undefined") {
          embed.footer = {
            text: "",
          };
          if (typeof pid !== "undefined") {
            embed.footer.text += `PID: ${pid}`;
          }
          if (typeof pid !== "undefined" && typeof hostname !== "undefined") {
            embed.footer.text += " -- ";
          }
          if (typeof hostname !== "undefined") {
            embed.footer.text += `Host: ${hostname}`;
          }
        }
        embed.timestamp = new Date(time).toISOString();
        body.embeds = [embed];

        if (typeof mentionId !== "undefined" && shouldMention(level, mentionLevel)) {
          body.allowed_mentions = {
            users: [mentionId],
          };
          body.content = `<@${mentionId}>`;
        }
        const init: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        };
        const response = await fetch(webhookUrl, init);
        if (!response.ok) {
          console.error(`Error posting Discord message -- Error ${response.status} ${response.statusText}`);
        }
      } else {
        console.warn("Log line was not a valid pino log entry");
        console.warn(log);
      }
    }
  });
}

export interface DiscordTransportOptions {
  webhookUrl: string;
  mentionId?: string;
  mentionLevel?: MentionLevel;
}
