import { OptOutAgreement } from "./opt-out-agreement.js";

/** How screens and exports show a opt out agreement. */
export class OptOutAgreementView {
  codeText: string;
  name: string;
  source: string;
  graceDays: string;
  campaignRef: string;
  quantity: string;
  openRate: string;
  bid: string;
  windowDays: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    source: string,
    graceDays: string,
    campaignRef: string,
    quantity: string,
    openRate: string,
    bid: string,
    windowDays: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.source = source;
    this.graceDays = graceDays;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.openRate = openRate;
    this.bid = bid;
    this.windowDays = windowDays;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutAgreementView(item: OptOutAgreement): OptOutAgreementView {
  return new OptOutAgreementView(
    item.code,
    item.name,
    item.source,
    String(item.graceDays),
    item.campaignRef,
    String(item.quantity),
    item.openRate.toFixed(2),
    item.bid.toFixed(2),
    String(item.windowDays),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutAgreementViews(items: OptOutAgreement[]): OptOutAgreementView[] {
  const views: OptOutAgreementView[] = [];
  for (const item of items) {
    views.push(toOptOutAgreementView(item));
  }
  return views;
}

export function sumOptOutAgreementView(view: OptOutAgreementView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedGraceDays + parsedQuantity + parsedOpenRate;
}
