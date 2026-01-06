export type MsgTag = { label: string; tone?: "ok" | "warn" | "neutral" };

export type ChatMessage = {
  id: string;
  who: "assistant" | "user";
  text: string;
  time: string;
  tags?: MsgTag[];
};

export type RightTab = "tools" | "db" | "logs";
