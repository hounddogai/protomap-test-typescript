import * as text from "../../../../kit/text.js";
import { WaitMilestone } from "./wait-milestone.js";

/** How screens and exports show a wait milestone. */
export class WaitMilestoneView {
  code: string;
  label: string;
  name: string;
  visible: string;
  locale: string;
  titleText: string;
  active: string;
  bid: string;
  conversionRateText: string;
  audienceId: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    name: string,
    visible: string,
    locale: string,
    titleText: string,
    active: string,
    bid: string,
    conversionRateText: string,
    audienceId: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.visible = visible;
    this.locale = locale;
    this.titleText = titleText;
    this.active = active;
    this.bid = bid;
    this.conversionRateText = conversionRateText;
    this.audienceId = audienceId;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toWaitMilestoneView(item: WaitMilestone): WaitMilestoneView {
  return new WaitMilestoneView(
    item.code,
    item.label,
    text.truncate(item.name, 80),
    `${item.visible}`,
    text.truncate(item.locale, 80),
    item.title,
    `${item.active}`,
    item.bid.toFixed(2),
    item.conversionRate.toFixed(2),
    item.audienceId,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitMilestoneViews(items: WaitMilestone[]): WaitMilestoneView[] {
  const views: WaitMilestoneView[] = [];
  for (const item of items) {
    views.push(toWaitMilestoneView(item));
  }
  return views;
}

export function sumWaitMilestoneView(view: WaitMilestoneView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedBid + parsedConversionRate;
}
