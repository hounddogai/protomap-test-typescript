import * as text from "../../../../kit/text.js";
import { LenientRewardProfile } from "./lenient-reward-profile.js";

/** How screens and exports show a lenient reward profile. */
export class LenientRewardProfileView {
  code: string;
  label: string;
  segment: string;
  score: string;
  sourceText: string;
  createdAtText: string;
  approved: string;
  priorityText: string;
  sequenceText: string;
  amount: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    segment: string,
    score: string,
    sourceText: string,
    createdAtText: string,
    approved: string,
    priorityText: string,
    sequenceText: string,
    amount: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.score = score;
    this.sourceText = sourceText;
    this.createdAtText = createdAtText;
    this.approved = approved;
    this.priorityText = priorityText;
    this.sequenceText = sequenceText;
    this.amount = amount;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRewardProfileView(item: LenientRewardProfile): LenientRewardProfileView {
  return new LenientRewardProfileView(
    item.code,
    item.label,
    text.truncate(item.segment, 40),
    item.score.toFixed(2),
    text.truncate(item.source, 64),
    String(item.createdAt),
    `${item.approved}`,
    String(item.priority),
    String(item.sequence),
    item.amount.toFixed(2),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRewardProfileViews(items: LenientRewardProfile[]): LenientRewardProfileView[] {
  const views: LenientRewardProfileView[] = [];
  for (const item of items) {
    views.push(toLenientRewardProfileView(item));
  }
  return views;
}

export function sumLenientRewardProfileView(view: LenientRewardProfileView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedScore + parsedCreatedAt + parsedPriority;
}
