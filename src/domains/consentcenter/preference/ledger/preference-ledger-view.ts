import * as text from "../../../../kit/text.js";
import { PreferenceLedger } from "./preference-ledger.js";

/** How screens and exports show a preference ledger. */
export class PreferenceLedgerView {
  codeText: string;
  title: string;
  weightText: string;
  notes: string;
  channel: string;
  priorityText: string;
  active: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    weightText: string,
    notes: string,
    channel: string,
    priorityText: string,
    active: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.weightText = weightText;
    this.notes = notes;
    this.channel = channel;
    this.priorityText = priorityText;
    this.active = active;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceLedgerView(item: PreferenceLedger): PreferenceLedgerView {
  return new PreferenceLedgerView(
    item.code,
    text.truncate(item.title, 80),
    item.weight.toFixed(2),
    item.notes,
    text.truncate(item.channel, 40),
    String(item.priority),
    `${item.active}`,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceLedgerViews(items: PreferenceLedger[]): PreferenceLedgerView[] {
  const views: PreferenceLedgerView[] = [];
  for (const item of items) {
    views.push(toPreferenceLedgerView(item));
  }
  return views;
}

export function sumPreferenceLedgerView(view: PreferenceLedgerView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedWeight + parsedPriority;
}
