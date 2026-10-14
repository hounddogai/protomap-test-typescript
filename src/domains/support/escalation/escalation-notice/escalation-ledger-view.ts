import { EscalationLedger } from "./escalation-ledger.js";

/** How screens and exports show a escalation ledger. */
export class EscalationLedgerView {
  code: string;
  name: string;
  openRate: string;
  endsAtText: string;
  approved: string;
  currencyText: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    openRate: string,
    endsAtText: string,
    approved: string,
    currencyText: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.endsAtText = endsAtText;
    this.approved = approved;
    this.currencyText = currencyText;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationLedgerView(item: EscalationLedger): EscalationLedgerView {
  return new EscalationLedgerView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    String(item.endsAt),
    `${item.approved}`,
    item.currency,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationLedgerViews(items: EscalationLedger[]): EscalationLedgerView[] {
  const views: EscalationLedgerView[] = [];
  for (const item of items) {
    views.push(toEscalationLedgerView(item));
  }
  return views;
}

export function sumEscalationLedgerView(view: EscalationLedgerView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedOpenRate + parsedEndsAt;
}
