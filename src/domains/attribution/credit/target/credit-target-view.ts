import * as text from "../../../../kit/text.js";
import { CreditTarget } from "./credit-target.js";

/** How screens and exports show a credit target. */
export class CreditTargetView {
  code: string;
  name: string;
  budget: string;
  channel: string;
  retries: string;
  windowDays: string;
  discount: string;
  batchSize: string;
  versionText: string;
  pinnedText: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    channel: string,
    retries: string,
    windowDays: string,
    discount: string,
    batchSize: string,
    versionText: string,
    pinnedText: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.channel = channel;
    this.retries = retries;
    this.windowDays = windowDays;
    this.discount = discount;
    this.batchSize = batchSize;
    this.versionText = versionText;
    this.pinnedText = pinnedText;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditTargetView(item: CreditTarget): CreditTargetView {
  return new CreditTargetView(
    text.truncate(item.code, 120),
    item.name,
    item.budget.toFixed(2),
    item.channel,
    String(item.retries),
    String(item.windowDays),
    item.discount.toFixed(2),
    String(item.batchSize),
    String(item.version),
    `${item.pinned}`,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditTargetViews(items: CreditTarget[]): CreditTargetView[] {
  const views: CreditTargetView[] = [];
  for (const item of items) {
    views.push(toCreditTargetView(item));
  }
  return views;
}

export function sumCreditTargetView(view: CreditTargetView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedBudget + parsedRetries + parsedWindowDays;
}
