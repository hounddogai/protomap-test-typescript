import { ScheduledBranchLedger } from "./scheduled-branch-ledger.js";

/** How screens and exports show a scheduled branch ledger. */
export class ScheduledBranchLedgerView {
  code: string;
  title: string;
  segment: string;
  approved: string;
  frequencyCapText: string;
  utmSource: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    segment: string,
    approved: string,
    frequencyCapText: string,
    utmSource: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.approved = approved;
    this.frequencyCapText = frequencyCapText;
    this.utmSource = utmSource;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledBranchLedgerView(item: ScheduledBranchLedger): ScheduledBranchLedgerView {
  return new ScheduledBranchLedgerView(
    item.code,
    item.title,
    item.segment,
    `${item.approved}`,
    String(item.frequencyCap),
    item.utmSource,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledBranchLedgerViews(items: ScheduledBranchLedger[]): ScheduledBranchLedgerView[] {
  const views: ScheduledBranchLedgerView[] = [];
  for (const item of items) {
    views.push(toScheduledBranchLedgerView(item));
  }
  return views;
}

export function sumScheduledBranchLedgerView(view: ScheduledBranchLedgerView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFrequencyCap + parsedBudget;
}
