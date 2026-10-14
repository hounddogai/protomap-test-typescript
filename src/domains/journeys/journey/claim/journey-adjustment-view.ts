import * as text from "../../../../kit/text.js";
import { JourneyAdjustment } from "./journey-adjustment.js";

/** How screens and exports show a journey adjustment. */
export class JourneyAdjustmentView {
  code: string;
  title: string;
  phoneText: string;
  threshold: string;
  startsAtText: string;
  journeyId: string;
  ceiling: string;
  campaignRef: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    phoneText: string,
    threshold: string,
    startsAtText: string,
    journeyId: string,
    ceiling: string,
    campaignRef: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.phoneText = phoneText;
    this.threshold = threshold;
    this.startsAtText = startsAtText;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyAdjustmentView(item: JourneyAdjustment): JourneyAdjustmentView {
  return new JourneyAdjustmentView(
    item.code,
    item.title,
    item.phone,
    item.threshold.toFixed(2),
    String(item.startsAt),
    text.truncate(item.journeyId, 80),
    item.ceiling.toFixed(2),
    item.campaignRef,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyAdjustmentViews(items: JourneyAdjustment[]): JourneyAdjustmentView[] {
  const views: JourneyAdjustmentView[] = [];
  for (const item of items) {
    views.push(toJourneyAdjustmentView(item));
  }
  return views;
}

export function sumJourneyAdjustmentView(view: JourneyAdjustmentView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedThreshold + parsedStartsAt + parsedCeiling;
}
