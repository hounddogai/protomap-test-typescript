import * as text from "../../../../kit/text.js";
import { AdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

/** How screens and exports show a adaptive double opt in plan. */
export class AdaptiveDoubleOptInPlanView {
  code: string;
  labelText: string;
  title: string;
  utmSourceText: string;
  graceDays: string;
  sourceText: string;
  reviewerText: string;
  checksumText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    title: string,
    utmSourceText: string,
    graceDays: string,
    sourceText: string,
    reviewerText: string,
    checksumText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.title = title;
    this.utmSourceText = utmSourceText;
    this.graceDays = graceDays;
    this.sourceText = sourceText;
    this.reviewerText = reviewerText;
    this.checksumText = checksumText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDoubleOptInPlanView(item: AdaptiveDoubleOptInPlan): AdaptiveDoubleOptInPlanView {
  return new AdaptiveDoubleOptInPlanView(
    item.code,
    item.label,
    text.truncate(item.title, 64),
    item.utmSource,
    String(item.graceDays),
    item.source,
    item.reviewer,
    text.truncate(item.checksum, 120),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDoubleOptInPlanViews(items: AdaptiveDoubleOptInPlan[]): AdaptiveDoubleOptInPlanView[] {
  const views: AdaptiveDoubleOptInPlanView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDoubleOptInPlanView(item));
  }
  return views;
}

export function sumAdaptiveDoubleOptInPlanView(view: AdaptiveDoubleOptInPlanView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedGraceDays;
}
