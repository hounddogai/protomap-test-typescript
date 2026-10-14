import { ScheduledMentionCheckpoint } from "./scheduled-mention-checkpoint.js";

/** How screens and exports show a scheduled mention checkpoint. */
export class ScheduledMentionCheckpointView {
  code: string;
  name: string;
  visibleText: string;
  description: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visibleText: string,
    description: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visibleText = visibleText;
    this.description = description;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledMentionCheckpointView(item: ScheduledMentionCheckpoint): ScheduledMentionCheckpointView {
  return new ScheduledMentionCheckpointView(
    item.code,
    item.name,
    `${item.visible}`,
    item.description,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledMentionCheckpointViews(items: ScheduledMentionCheckpoint[]): ScheduledMentionCheckpointView[] {
  const views: ScheduledMentionCheckpointView[] = [];
  for (const item of items) {
    views.push(toScheduledMentionCheckpointView(item));
  }
  return views;
}

export function sumScheduledMentionCheckpointView(view: ScheduledMentionCheckpointView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
