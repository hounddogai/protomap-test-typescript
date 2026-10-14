import * as text from "../../../../kit/text.js";
import { DomainPolicy } from "./domain-policy.js";

/** How screens and exports show a domain policy. */
export class DomainPolicyView {
  code: string;
  title: string;
  visibleText: string;
  minimum: string;
  amount: string;
  durationMinutes: string;
  approved: string;
  utmSource: string;
  summary: string;
  capacity: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visibleText: string,
    minimum: string,
    amount: string,
    durationMinutes: string,
    approved: string,
    utmSource: string,
    summary: string,
    capacity: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visibleText = visibleText;
    this.minimum = minimum;
    this.amount = amount;
    this.durationMinutes = durationMinutes;
    this.approved = approved;
    this.utmSource = utmSource;
    this.summary = summary;
    this.capacity = capacity;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toDomainPolicyView(item: DomainPolicy): DomainPolicyView {
  return new DomainPolicyView(
    text.truncate(item.code, 40),
    item.title,
    `${item.visible}`,
    item.minimum.toFixed(2),
    item.amount.toFixed(2),
    String(item.durationMinutes),
    `${item.approved}`,
    item.utmSource,
    text.truncate(item.summary, 120),
    String(item.capacity),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainPolicyViews(items: DomainPolicy[]): DomainPolicyView[] {
  const views: DomainPolicyView[] = [];
  for (const item of items) {
    views.push(toDomainPolicyView(item));
  }
  return views;
}

export function sumDomainPolicyView(view: DomainPolicyView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedMinimum + parsedAmount + parsedDurationMinutes;
}
