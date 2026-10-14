import * as text from "../../../../kit/text.js";
import { PrimaryJourneyAudit } from "./primary-journey-audit.js";

/** How screens and exports show a primary journey audit. */
export class PrimaryJourneyAuditView {
  code: string;
  labelText: string;
  titleText: string;
  endsAt: string;
  amount: string;
  currency: string;
  version: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    titleText: string,
    endsAt: string,
    amount: string,
    currency: string,
    version: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.titleText = titleText;
    this.endsAt = endsAt;
    this.amount = amount;
    this.currency = currency;
    this.version = version;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryJourneyAuditView(item: PrimaryJourneyAudit): PrimaryJourneyAuditView {
  return new PrimaryJourneyAuditView(
    item.code,
    item.label,
    item.title,
    String(item.endsAt),
    item.amount.toFixed(2),
    text.truncate(item.currency, 40),
    String(item.version),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryJourneyAuditViews(items: PrimaryJourneyAudit[]): PrimaryJourneyAuditView[] {
  const views: PrimaryJourneyAuditView[] = [];
  for (const item of items) {
    views.push(toPrimaryJourneyAuditView(item));
  }
  return views;
}

export function sumPrimaryJourneyAuditView(view: PrimaryJourneyAuditView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedEndsAt + parsedAmount + parsedVersion;
}
