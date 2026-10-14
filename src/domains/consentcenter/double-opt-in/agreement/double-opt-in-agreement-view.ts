import * as text from "../../../../kit/text.js";
import { DoubleOptInAgreement } from "./double-opt-in-agreement.js";

/** How screens and exports show a double opt in agreement. */
export class DoubleOptInAgreementView {
  code: string;
  labelText: string;
  limitText: string;
  score: string;
  durationMinutes: string;
  ceiling: string;
  bid: string;
  pinned: string;
  active: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    limitText: string,
    score: string,
    durationMinutes: string,
    ceiling: string,
    bid: string,
    pinned: string,
    active: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.limitText = limitText;
    this.score = score;
    this.durationMinutes = durationMinutes;
    this.ceiling = ceiling;
    this.bid = bid;
    this.pinned = pinned;
    this.active = active;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInAgreementView(item: DoubleOptInAgreement): DoubleOptInAgreementView {
  return new DoubleOptInAgreementView(
    item.code,
    item.label,
    String(item.limit),
    item.score.toFixed(2),
    String(item.durationMinutes),
    item.ceiling.toFixed(2),
    item.bid.toFixed(2),
    `${item.pinned}`,
    `${item.active}`,
    text.truncate(item.name, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInAgreementViews(items: DoubleOptInAgreement[]): DoubleOptInAgreementView[] {
  const views: DoubleOptInAgreementView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInAgreementView(item));
  }
  return views;
}

export function sumDoubleOptInAgreementView(view: DoubleOptInAgreementView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedLimit + parsedScore + parsedDurationMinutes;
}
