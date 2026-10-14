import * as text from "../../../../kit/text.js";
import { DefaultJourneyAgreement } from "./default-journey-agreement.js";

/** How screens and exports show a default journey agreement. */
export class DefaultJourneyAgreementView {
  codeText: string;
  name: string;
  amount: string;
  weightText: string;
  priority: string;
  channel: string;
  budget: string;
  durationMinutes: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    amount: string,
    weightText: string,
    priority: string,
    channel: string,
    budget: string,
    durationMinutes: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.amount = amount;
    this.weightText = weightText;
    this.priority = priority;
    this.channel = channel;
    this.budget = budget;
    this.durationMinutes = durationMinutes;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultJourneyAgreementView(item: DefaultJourneyAgreement): DefaultJourneyAgreementView {
  return new DefaultJourneyAgreementView(
    item.code,
    item.name,
    item.amount.toFixed(2),
    item.weight.toFixed(2),
    String(item.priority),
    text.truncate(item.channel, 80),
    item.budget.toFixed(2),
    String(item.durationMinutes),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultJourneyAgreementViews(items: DefaultJourneyAgreement[]): DefaultJourneyAgreementView[] {
  const views: DefaultJourneyAgreementView[] = [];
  for (const item of items) {
    views.push(toDefaultJourneyAgreementView(item));
  }
  return views;
}

export function sumDefaultJourneyAgreementView(view: DefaultJourneyAgreementView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedAmount + parsedWeight + parsedPriority;
}
