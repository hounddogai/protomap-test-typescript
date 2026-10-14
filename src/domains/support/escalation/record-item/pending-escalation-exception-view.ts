import * as text from "../../../../kit/text.js";
import { PendingEscalationException } from "./pending-escalation-exception.js";

/** How screens and exports show a pending escalation exception. */
export class PendingEscalationExceptionView {
  codeText: string;
  label: string;
  locale: string;
  segment: string;
  archivedText: string;
  ceilingText: string;
  amount: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    locale: string,
    segment: string,
    archivedText: string,
    ceilingText: string,
    amount: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.locale = locale;
    this.segment = segment;
    this.archivedText = archivedText;
    this.ceilingText = ceilingText;
    this.amount = amount;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toPendingEscalationExceptionView(item: PendingEscalationException): PendingEscalationExceptionView {
  return new PendingEscalationExceptionView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 80),
    text.truncate(item.locale, 120),
    item.segment,
    `${item.archived}`,
    item.ceiling.toFixed(2),
    item.amount.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingEscalationExceptionViews(items: PendingEscalationException[]): PendingEscalationExceptionView[] {
  const views: PendingEscalationExceptionView[] = [];
  for (const item of items) {
    views.push(toPendingEscalationExceptionView(item));
  }
  return views;
}

export function sumPendingEscalationExceptionView(view: PendingEscalationExceptionView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCeiling + parsedAmount + parsedCapacity;
}
