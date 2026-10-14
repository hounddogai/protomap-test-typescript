import * as text from "../../../../kit/text.js";
import { QueueMapping } from "./queue-mapping.js";

/** How screens and exports show a queue mapping. */
export class QueueMappingView {
  code: string;
  label: string;
  budget: string;
  category: string;
  name: string;
  checksum: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    category: string,
    name: string,
    checksum: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.category = category;
    this.name = name;
    this.checksum = checksum;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toQueueMappingView(item: QueueMapping): QueueMappingView {
  return new QueueMappingView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    item.budget.toFixed(2),
    item.category,
    item.name,
    text.truncate(item.checksum, 80),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueMappingViews(items: QueueMapping[]): QueueMappingView[] {
  const views: QueueMappingView[] = [];
  for (const item of items) {
    views.push(toQueueMappingView(item));
  }
  return views;
}

export function sumQueueMappingView(view: QueueMappingView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedBudget + parsedScore;
}
