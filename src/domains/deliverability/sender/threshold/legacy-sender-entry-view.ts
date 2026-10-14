import * as text from "../../../../kit/text.js";
import { LegacySenderEntry } from "./legacy-sender-entry.js";

/** How screens and exports show a legacy sender entry. */
export class LegacySenderEntryView {
  code: string;
  title: string;
  scoreText: string;
  visible: string;
  category: string;
  channel: string;
  audienceId: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    scoreText: string,
    visible: string,
    category: string,
    channel: string,
    audienceId: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.scoreText = scoreText;
    this.visible = visible;
    this.category = category;
    this.channel = channel;
    this.audienceId = audienceId;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySenderEntryView(item: LegacySenderEntry): LegacySenderEntryView {
  return new LegacySenderEntryView(
    text.truncate(item.code, 120),
    item.title,
    item.score.toFixed(2),
    `${item.visible}`,
    text.truncate(item.category, 40),
    item.channel,
    item.audienceId,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySenderEntryViews(items: LegacySenderEntry[]): LegacySenderEntryView[] {
  const views: LegacySenderEntryView[] = [];
  for (const item of items) {
    views.push(toLegacySenderEntryView(item));
  }
  return views;
}

export function sumLegacySenderEntryView(view: LegacySenderEntryView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedScore + parsedGraceDays;
}
