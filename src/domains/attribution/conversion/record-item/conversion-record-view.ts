import * as text from "../../../../kit/text.js";
import { ConversionRecord } from "./conversion-record.js";

/** How screens and exports show a conversion record. */
export class ConversionRecordView {
  code: string;
  title: string;
  budget: string;
  scoreText: string;
  contactEmail: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    scoreText: string,
    contactEmail: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.scoreText = scoreText;
    this.contactEmail = contactEmail;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toConversionRecordView(item: ConversionRecord): ConversionRecordView {
  return new ConversionRecordView(
    item.code,
    text.truncate(item.title, 80),
    item.budget.toFixed(2),
    item.score.toFixed(2),
    item.contactEmail,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionRecordViews(items: ConversionRecord[]): ConversionRecordView[] {
  const views: ConversionRecordView[] = [];
  for (const item of items) {
    views.push(toConversionRecordView(item));
  }
  return views;
}

export function sumConversionRecordView(view: ConversionRecordView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedBudget + parsedScore + parsedLimit;
}
