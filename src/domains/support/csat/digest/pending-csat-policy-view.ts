import * as text from "../../../../kit/text.js";
import { PendingCsatPolicy } from "./pending-csat-policy.js";

/** How screens and exports show a pending csat policy. */
export class PendingCsatPolicyView {
  code: string;
  nameText: string;
  version: string;
  label: string;
  journeyId: string;
  quantity: string;
  segmentText: string;
  bidText: string;
  budgetText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    version: string,
    label: string,
    journeyId: string,
    quantity: string,
    segmentText: string,
    bidText: string,
    budgetText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.version = version;
    this.label = label;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.segmentText = segmentText;
    this.bidText = bidText;
    this.budgetText = budgetText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCsatPolicyView(item: PendingCsatPolicy): PendingCsatPolicyView {
  return new PendingCsatPolicyView(
    item.code,
    item.name,
    String(item.version),
    text.truncate(item.label, 64),
    item.journeyId,
    String(item.quantity),
    item.segment,
    item.bid.toFixed(2),
    item.budget.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCsatPolicyViews(items: PendingCsatPolicy[]): PendingCsatPolicyView[] {
  const views: PendingCsatPolicyView[] = [];
  for (const item of items) {
    views.push(toPendingCsatPolicyView(item));
  }
  return views;
}

export function sumPendingCsatPolicyView(view: PendingCsatPolicyView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedVersion + parsedQuantity + parsedBid;
}
