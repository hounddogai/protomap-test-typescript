import * as text from "../../../../kit/text.js";
import { ScheduledInviteCheckpoint } from "./scheduled-invite-checkpoint.js";

/** How screens and exports show a scheduled invite checkpoint. */
export class ScheduledInviteCheckpointView {
  codeText: string;
  title: string;
  priority: string;
  quantityText: string;
  score: string;
  batchSizeText: string;
  weight: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    priority: string,
    quantityText: string,
    score: string,
    batchSizeText: string,
    weight: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.priority = priority;
    this.quantityText = quantityText;
    this.score = score;
    this.batchSizeText = batchSizeText;
    this.weight = weight;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledInviteCheckpointView(item: ScheduledInviteCheckpoint): ScheduledInviteCheckpointView {
  return new ScheduledInviteCheckpointView(
    item.code,
    text.truncate(item.title, 80),
    String(item.priority),
    String(item.quantity),
    item.score.toFixed(2),
    String(item.batchSize),
    item.weight.toFixed(2),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledInviteCheckpointViews(items: ScheduledInviteCheckpoint[]): ScheduledInviteCheckpointView[] {
  const views: ScheduledInviteCheckpointView[] = [];
  for (const item of items) {
    views.push(toScheduledInviteCheckpointView(item));
  }
  return views;
}

export function sumScheduledInviteCheckpointView(view: ScheduledInviteCheckpointView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedPriority + parsedQuantity + parsedScore;
}
