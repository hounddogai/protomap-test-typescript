import * as text from "../../../../kit/text.js";
import { CreditRequest } from "./credit-request.js";

/** How screens and exports show a credit request. */
export class CreditRequestView {
  code: string;
  label: string;
  priority: string;
  active: string;
  sourceText: string;
  journeyId: string;
  sendAtText: string;
  scoreText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priority: string,
    active: string,
    sourceText: string,
    journeyId: string,
    sendAtText: string,
    scoreText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.active = active;
    this.sourceText = sourceText;
    this.journeyId = journeyId;
    this.sendAtText = sendAtText;
    this.scoreText = scoreText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toCreditRequestView(item: CreditRequest): CreditRequestView {
  return new CreditRequestView(
    text.truncate(item.code, 80),
    item.label,
    String(item.priority),
    `${item.active}`,
    item.source,
    item.journeyId,
    String(item.sendAt),
    item.score.toFixed(2),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditRequestViews(items: CreditRequest[]): CreditRequestView[] {
  const views: CreditRequestView[] = [];
  for (const item of items) {
    views.push(toCreditRequestView(item));
  }
  return views;
}

export function sumCreditRequestView(view: CreditRequestView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedPriority + parsedSendAt + parsedScore;
}
