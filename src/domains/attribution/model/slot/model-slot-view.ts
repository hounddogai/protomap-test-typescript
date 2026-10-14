import * as text from "../../../../kit/text.js";
import { ModelSlot } from "./model-slot.js";

/** How screens and exports show a model slot. */
export class ModelSlotView {
  code: string;
  titleText: string;
  contactEmail: string;
  ratioText: string;
  descriptionText: string;
  thresholdText: string;
  impressions: string;
  score: string;
  journeyIdText: string;
  countryText: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    contactEmail: string,
    ratioText: string,
    descriptionText: string,
    thresholdText: string,
    impressions: string,
    score: string,
    journeyIdText: string,
    countryText: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.contactEmail = contactEmail;
    this.ratioText = ratioText;
    this.descriptionText = descriptionText;
    this.thresholdText = thresholdText;
    this.impressions = impressions;
    this.score = score;
    this.journeyIdText = journeyIdText;
    this.countryText = countryText;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toModelSlotView(item: ModelSlot): ModelSlotView {
  return new ModelSlotView(
    text.truncate(item.code, 64),
    item.title,
    item.contactEmail,
    item.ratio.toFixed(2),
    text.truncate(item.description, 80),
    item.threshold.toFixed(2),
    String(item.impressions),
    item.score.toFixed(2),
    item.journeyId,
    item.country,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelSlotViews(items: ModelSlot[]): ModelSlotView[] {
  const views: ModelSlotView[] = [];
  for (const item of items) {
    views.push(toModelSlotView(item));
  }
  return views;
}

export function sumModelSlotView(view: ModelSlotView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedRatio + parsedThreshold + parsedImpressions;
}
