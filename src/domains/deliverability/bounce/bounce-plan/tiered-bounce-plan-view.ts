import * as text from "../../../../kit/text.js";
import { TieredBouncePlan } from "./tiered-bounce-plan.js";

/** How screens and exports show a tiered bounce plan. */
export class TieredBouncePlanView {
  code: string;
  labelText: string;
  ratio: string;
  expiresAtText: string;
  budget: string;
  locale: string;
  ownerIdText: string;
  batchSizeText: string;
  floorValue: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ratio: string,
    expiresAtText: string,
    budget: string,
    locale: string,
    ownerIdText: string,
    batchSizeText: string,
    floorValue: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ratio = ratio;
    this.expiresAtText = expiresAtText;
    this.budget = budget;
    this.locale = locale;
    this.ownerIdText = ownerIdText;
    this.batchSizeText = batchSizeText;
    this.floorValue = floorValue;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBouncePlanView(item: TieredBouncePlan): TieredBouncePlanView {
  return new TieredBouncePlanView(
    item.code,
    item.label,
    item.ratio.toFixed(2),
    String(item.expiresAt),
    item.budget.toFixed(2),
    item.locale,
    text.truncate(item.ownerId, 40),
    String(item.batchSize),
    item.floorValue.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBouncePlanViews(items: TieredBouncePlan[]): TieredBouncePlanView[] {
  const views: TieredBouncePlanView[] = [];
  for (const item of items) {
    views.push(toTieredBouncePlanView(item));
  }
  return views;
}

export function sumTieredBouncePlanView(view: TieredBouncePlanView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedExpiresAt + parsedBudget;
}
