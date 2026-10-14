import * as text from "../../../../kit/text.js";
import { ChallengeRecord } from "./challenge-record.js";

/** How screens and exports show a challenge record. */
export class ChallengeRecordView {
  codeText: string;
  labelText: string;
  notesText: string;
  discountText: string;
  createdAt: string;
  minimum: string;
  budget: string;
  floorValueText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    notesText: string,
    discountText: string,
    createdAt: string,
    minimum: string,
    budget: string,
    floorValueText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.notesText = notesText;
    this.discountText = discountText;
    this.createdAt = createdAt;
    this.minimum = minimum;
    this.budget = budget;
    this.floorValueText = floorValueText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeRecordView(item: ChallengeRecord): ChallengeRecordView {
  return new ChallengeRecordView(
    item.code,
    text.truncate(item.label, 80),
    item.notes,
    item.discount.toFixed(2),
    String(item.createdAt),
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    item.floorValue.toFixed(2),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeRecordViews(items: ChallengeRecord[]): ChallengeRecordView[] {
  const views: ChallengeRecordView[] = [];
  for (const item of items) {
    views.push(toChallengeRecordView(item));
  }
  return views;
}

export function sumChallengeRecordView(view: ChallengeRecordView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedDiscount + parsedCreatedAt + parsedMinimum;
}
