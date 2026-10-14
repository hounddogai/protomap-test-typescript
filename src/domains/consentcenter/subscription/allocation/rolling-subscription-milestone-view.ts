import * as text from "../../../../kit/text.js";
import { RollingSubscriptionMilestone } from "./rolling-subscription-milestone.js";

/** How screens and exports show a rolling subscription milestone. */
export class RollingSubscriptionMilestoneView {
  code: string;
  title: string;
  channel: string;
  journeyId: string;
  frequencyCap: string;
  cost: string;
  floorValue: string;
  conversionRate: string;
  campaignRef: string;
  budgetText: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channel: string,
    journeyId: string,
    frequencyCap: string,
    cost: string,
    floorValue: string,
    conversionRate: string,
    campaignRef: string,
    budgetText: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.budgetText = budgetText;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSubscriptionMilestoneView(item: RollingSubscriptionMilestone): RollingSubscriptionMilestoneView {
  return new RollingSubscriptionMilestoneView(
    item.code,
    item.title,
    item.channel,
    text.truncate(item.journeyId, 40),
    String(item.frequencyCap),
    item.cost.toFixed(2),
    item.floorValue.toFixed(2),
    item.conversionRate.toFixed(2),
    item.campaignRef,
    item.budget.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSubscriptionMilestoneViews(items: RollingSubscriptionMilestone[]): RollingSubscriptionMilestoneView[] {
  const views: RollingSubscriptionMilestoneView[] = [];
  for (const item of items) {
    views.push(toRollingSubscriptionMilestoneView(item));
  }
  return views;
}

export function sumRollingSubscriptionMilestoneView(view: RollingSubscriptionMilestoneView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedFrequencyCap + parsedCost + parsedFloorValue;
}
