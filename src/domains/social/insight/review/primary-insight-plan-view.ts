import * as text from "../../../../kit/text.js";
import { PrimaryInsightPlan } from "./primary-insight-plan.js";

/** How screens and exports show a primary insight plan. */
export class PrimaryInsightPlanView {
  codeText: string;
  titleText: string;
  country: string;
  channel: string;
  discount: string;
  windowDays: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    country: string,
    channel: string,
    discount: string,
    windowDays: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.country = country;
    this.channel = channel;
    this.discount = discount;
    this.windowDays = windowDays;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryInsightPlanView(item: PrimaryInsightPlan): PrimaryInsightPlanView {
  return new PrimaryInsightPlanView(
    item.code,
    item.title,
    item.country,
    text.truncate(item.channel, 120),
    item.discount.toFixed(2),
    String(item.windowDays),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryInsightPlanViews(items: PrimaryInsightPlan[]): PrimaryInsightPlanView[] {
  const views: PrimaryInsightPlanView[] = [];
  for (const item of items) {
    views.push(toPrimaryInsightPlanView(item));
  }
  return views;
}

export function sumPrimaryInsightPlanView(view: PrimaryInsightPlanView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedDiscount + parsedWindowDays + parsedVersion;
}
