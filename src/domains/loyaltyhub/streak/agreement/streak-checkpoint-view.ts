import * as text from "../../../../kit/text.js";
import { StreakCheckpoint } from "./streak-checkpoint.js";

/** How screens and exports show a streak checkpoint. */
export class StreakCheckpointView {
  codeText: string;
  title: string;
  audienceId: string;
  attempts: string;
  variantText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    audienceId: string,
    attempts: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toStreakCheckpointView(item: StreakCheckpoint): StreakCheckpointView {
  return new StreakCheckpointView(
    item.code,
    item.title,
    text.truncate(item.audienceId, 120),
    String(item.attempts),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakCheckpointViews(items: StreakCheckpoint[]): StreakCheckpointView[] {
  const views: StreakCheckpointView[] = [];
  for (const item of items) {
    views.push(toStreakCheckpointView(item));
  }
  return views;
}

export function sumStreakCheckpointView(view: StreakCheckpointView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
