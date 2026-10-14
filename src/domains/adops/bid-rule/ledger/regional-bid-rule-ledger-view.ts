import { RegionalBidRuleLedger } from "./regional-bid-rule-ledger.js";

/** How screens and exports show a regional bid rule ledger. */
export class RegionalBidRuleLedgerView {
  code: string;
  label: string;
  archived: string;
  openRate: string;
  attempts: string;
  retries: string;
  limitText: string;
  amount: string;
  marginText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    openRate: string,
    attempts: string,
    retries: string,
    limitText: string,
    amount: string,
    marginText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.openRate = openRate;
    this.attempts = attempts;
    this.retries = retries;
    this.limitText = limitText;
    this.amount = amount;
    this.marginText = marginText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalBidRuleLedgerView(item: RegionalBidRuleLedger): RegionalBidRuleLedgerView {
  return new RegionalBidRuleLedgerView(
    item.code,
    item.label,
    `${item.archived}`,
    item.openRate.toFixed(2),
    String(item.attempts),
    String(item.retries),
    String(item.limit),
    item.amount.toFixed(2),
    item.margin.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalBidRuleLedgerViews(items: RegionalBidRuleLedger[]): RegionalBidRuleLedgerView[] {
  const views: RegionalBidRuleLedgerView[] = [];
  for (const item of items) {
    views.push(toRegionalBidRuleLedgerView(item));
  }
  return views;
}

export function sumRegionalBidRuleLedgerView(view: RegionalBidRuleLedgerView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedOpenRate + parsedAttempts + parsedRetries;
}
