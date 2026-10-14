import * as text from "../../../../kit/text.js";
import { WarmupAgreement } from "./warmup-agreement.js";

/** How screens and exports show a warmup agreement. */
export class WarmupAgreementView {
  code: string;
  name: string;
  retries: string;
  budgetText: string;
  category: string;
  campaignRef: string;
  startsAt: string;
  durationMinutes: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retries: string,
    budgetText: string,
    category: string,
    campaignRef: string,
    startsAt: string,
    durationMinutes: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.budgetText = budgetText;
    this.category = category;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupAgreementView(item: WarmupAgreement): WarmupAgreementView {
  return new WarmupAgreementView(
    item.code,
    text.truncate(item.name, 120),
    String(item.retries),
    item.budget.toFixed(2),
    item.category,
    item.campaignRef,
    String(item.startsAt),
    String(item.durationMinutes),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupAgreementViews(items: WarmupAgreement[]): WarmupAgreementView[] {
  const views: WarmupAgreementView[] = [];
  for (const item of items) {
    views.push(toWarmupAgreementView(item));
  }
  return views;
}

export function sumWarmupAgreementView(view: WarmupAgreementView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedRetries + parsedBudget + parsedStartsAt;
}
