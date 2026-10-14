import * as text from "../../../../kit/text.js";
import { StepPlan } from "./step-plan.js";

/** How screens and exports show a step plan. */
export class StepPlanView {
  code: string;
  label: string;
  pinned: string;
  region: string;
  journeyId: string;
  unit: string;
  impressions: string;
  summaryText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    pinned: string,
    region: string,
    journeyId: string,
    unit: string,
    impressions: string,
    summaryText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.region = region;
    this.journeyId = journeyId;
    this.unit = unit;
    this.impressions = impressions;
    this.summaryText = summaryText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toStepPlanView(item: StepPlan): StepPlanView {
  return new StepPlanView(
    item.code,
    item.label,
    `${item.pinned}`,
    text.truncate(item.region, 80),
    item.journeyId,
    text.truncate(item.unit, 40),
    String(item.impressions),
    item.summary,
    text.truncate(item.variant, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepPlanViews(items: StepPlan[]): StepPlanView[] {
  const views: StepPlanView[] = [];
  for (const item of items) {
    views.push(toStepPlanView(item));
  }
  return views;
}

export function sumStepPlanView(view: StepPlanView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedImpressions;
}
