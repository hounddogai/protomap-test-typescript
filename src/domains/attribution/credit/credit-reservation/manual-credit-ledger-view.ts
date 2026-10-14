import { ManualCreditLedger } from "./manual-credit-ledger.js";

/** How screens and exports show a manual credit ledger. */
export class ManualCreditLedgerView {
  code: string;
  label: string;
  weight: string;
  retriesText: string;
  versionText: string;
  priorityText: string;
  budget: string;
  variant: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weight: string,
    retriesText: string,
    versionText: string,
    priorityText: string,
    budget: string,
    variant: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.retriesText = retriesText;
    this.versionText = versionText;
    this.priorityText = priorityText;
    this.budget = budget;
    this.variant = variant;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toManualCreditLedgerView(item: ManualCreditLedger): ManualCreditLedgerView {
  return new ManualCreditLedgerView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    String(item.retries),
    String(item.version),
    String(item.priority),
    item.budget.toFixed(2),
    item.variant,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualCreditLedgerViews(items: ManualCreditLedger[]): ManualCreditLedgerView[] {
  const views: ManualCreditLedgerView[] = [];
  for (const item of items) {
    views.push(toManualCreditLedgerView(item));
  }
  return views;
}

export function sumManualCreditLedgerView(view: ManualCreditLedgerView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedWeight + parsedRetries + parsedVersion;
}
