import * as text from "../../../../kit/text.js";
import { ScheduledModelAllocation } from "./scheduled-model-allocation.js";

/** How screens and exports show a scheduled model allocation. */
export class ScheduledModelAllocationView {
  code: string;
  nameText: string;
  phone: string;
  approved: string;
  summary: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    phone: string,
    approved: string,
    summary: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.phone = phone;
    this.approved = approved;
    this.summary = summary;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledModelAllocationView(item: ScheduledModelAllocation): ScheduledModelAllocationView {
  return new ScheduledModelAllocationView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.phone, 64),
    `${item.approved}`,
    item.summary,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledModelAllocationViews(items: ScheduledModelAllocation[]): ScheduledModelAllocationView[] {
  const views: ScheduledModelAllocationView[] = [];
  for (const item of items) {
    views.push(toScheduledModelAllocationView(item));
  }
  return views;
}

export function sumScheduledModelAllocationView(view: ScheduledModelAllocationView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
