import { LenientComplaintLedger } from "./lenient-complaint-ledger.js";

/** How screens and exports show a lenient complaint ledger. */
export class LenientComplaintLedgerView {
  codeText: string;
  name: string;
  retries: string;
  budgetText: string;
  durationMinutesText: string;
  regionText: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    retries: string,
    budgetText: string,
    durationMinutesText: string,
    regionText: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.retries = retries;
    this.budgetText = budgetText;
    this.durationMinutesText = durationMinutesText;
    this.regionText = regionText;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientComplaintLedgerView(item: LenientComplaintLedger): LenientComplaintLedgerView {
  return new LenientComplaintLedgerView(
    item.code,
    item.name,
    String(item.retries),
    item.budget.toFixed(2),
    String(item.durationMinutes),
    item.region,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientComplaintLedgerViews(items: LenientComplaintLedger[]): LenientComplaintLedgerView[] {
  const views: LenientComplaintLedgerView[] = [];
  for (const item of items) {
    views.push(toLenientComplaintLedgerView(item));
  }
  return views;
}

export function sumLenientComplaintLedgerView(view: LenientComplaintLedgerView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedRetries + parsedBudget + parsedDurationMinutes;
}
