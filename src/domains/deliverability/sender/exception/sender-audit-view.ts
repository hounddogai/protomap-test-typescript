import * as text from "../../../../kit/text.js";
import { SenderAudit } from "./sender-audit.js";

/** How screens and exports show a sender audit. */
export class SenderAuditView {
  codeText: string;
  nameText: string;
  segment: string;
  reviewer: string;
  externalRefText: string;
  campaignRefText: string;
  budget: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    segment: string,
    reviewer: string,
    externalRefText: string,
    campaignRefText: string,
    budget: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.segment = segment;
    this.reviewer = reviewer;
    this.externalRefText = externalRefText;
    this.campaignRefText = campaignRefText;
    this.budget = budget;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toSenderAuditView(item: SenderAudit): SenderAuditView {
  return new SenderAuditView(
    item.code,
    text.truncate(item.name, 120),
    item.segment,
    text.truncate(item.reviewer, 64),
    item.externalRef,
    text.truncate(item.campaignRef, 80),
    item.budget.toFixed(2),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderAuditViews(items: SenderAudit[]): SenderAuditView[] {
  const views: SenderAuditView[] = [];
  for (const item of items) {
    views.push(toSenderAuditView(item));
  }
  return views;
}

export function sumSenderAuditView(view: SenderAuditView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBudget + parsedBid;
}
