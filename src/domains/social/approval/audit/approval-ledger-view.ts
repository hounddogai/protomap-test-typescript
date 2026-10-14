import { ApprovalLedger } from "./approval-ledger.js";

/** How screens and exports show a approval ledger. */
export class ApprovalLedgerView {
  code: string;
  name: string;
  rate: string;
  budget: string;
  marginText: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    budget: string,
    marginText: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.budget = budget;
    this.marginText = marginText;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalLedgerView(item: ApprovalLedger): ApprovalLedgerView {
  return new ApprovalLedgerView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    item.margin.toFixed(2),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalLedgerViews(items: ApprovalLedger[]): ApprovalLedgerView[] {
  const views: ApprovalLedgerView[] = [];
  for (const item of items) {
    views.push(toApprovalLedgerView(item));
  }
  return views;
}

export function sumApprovalLedgerView(view: ApprovalLedgerView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedRate + parsedBudget + parsedMargin;
}
