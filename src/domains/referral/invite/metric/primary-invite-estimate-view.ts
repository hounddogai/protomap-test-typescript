import * as text from "../../../../kit/text.js";
import { PrimaryInviteEstimate } from "./primary-invite-estimate.js";

/** How screens and exports show a primary invite estimate. */
export class PrimaryInviteEstimateView {
  codeText: string;
  name: string;
  ownerId: string;
  budgetText: string;
  conversionRate: string;
  priority: string;
  windowDays: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ownerId: string,
    budgetText: string,
    conversionRate: string,
    priority: string,
    windowDays: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ownerId = ownerId;
    this.budgetText = budgetText;
    this.conversionRate = conversionRate;
    this.priority = priority;
    this.windowDays = windowDays;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryInviteEstimateView(item: PrimaryInviteEstimate): PrimaryInviteEstimateView {
  return new PrimaryInviteEstimateView(
    item.code,
    item.name,
    text.truncate(item.ownerId, 120),
    item.budget.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.priority),
    String(item.windowDays),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryInviteEstimateViews(items: PrimaryInviteEstimate[]): PrimaryInviteEstimateView[] {
  const views: PrimaryInviteEstimateView[] = [];
  for (const item of items) {
    views.push(toPrimaryInviteEstimateView(item));
  }
  return views;
}

export function sumPrimaryInviteEstimateView(view: PrimaryInviteEstimateView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBudget + parsedConversionRate + parsedPriority;
}
