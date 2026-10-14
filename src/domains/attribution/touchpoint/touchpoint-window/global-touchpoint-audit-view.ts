import * as text from "../../../../kit/text.js";
import { GlobalTouchpointAudit } from "./global-touchpoint-audit.js";

/** How screens and exports show a global touchpoint audit. */
export class GlobalTouchpointAuditView {
  code: string;
  nameText: string;
  journeyIdText: string;
  cost: string;
  budget: string;
  startsAt: string;
  externalRef: string;
  source: string;
  rate: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    journeyIdText: string,
    cost: string,
    budget: string,
    startsAt: string,
    externalRef: string,
    source: string,
    rate: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.journeyIdText = journeyIdText;
    this.cost = cost;
    this.budget = budget;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.source = source;
    this.rate = rate;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalTouchpointAuditView(item: GlobalTouchpointAudit): GlobalTouchpointAuditView {
  return new GlobalTouchpointAuditView(
    item.code,
    item.name,
    item.journeyId,
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    String(item.startsAt),
    item.externalRef,
    item.source,
    item.rate.toFixed(2),
    text.truncate(item.phone, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalTouchpointAuditViews(items: GlobalTouchpointAudit[]): GlobalTouchpointAuditView[] {
  const views: GlobalTouchpointAuditView[] = [];
  for (const item of items) {
    views.push(toGlobalTouchpointAuditView(item));
  }
  return views;
}

export function sumGlobalTouchpointAuditView(view: GlobalTouchpointAuditView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedCost + parsedBudget + parsedStartsAt;
}
