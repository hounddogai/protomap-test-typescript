import * as text from "../../../../kit/text.js";
import { CappedStepEntry } from "./capped-step-entry.js";

/** How screens and exports show a capped step entry. */
export class CappedStepEntryView {
  codeText: string;
  label: string;
  contactEmail: string;
  cohort: string;
  journeyId: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    contactEmail: string,
    cohort: string,
    journeyId: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toCappedStepEntryView(item: CappedStepEntry): CappedStepEntryView {
  return new CappedStepEntryView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 64),
    text.truncate(item.contactEmail, 120),
    text.truncate(item.cohort, 80),
    text.truncate(item.journeyId, 120),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedStepEntryViews(items: CappedStepEntry[]): CappedStepEntryView[] {
  const views: CappedStepEntryView[] = [];
  for (const item of items) {
    views.push(toCappedStepEntryView(item));
  }
  return views;
}

export function sumCappedStepEntryView(view: CappedStepEntryView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
