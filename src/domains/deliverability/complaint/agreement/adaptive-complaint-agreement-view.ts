import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

/** How screens and exports show a adaptive complaint agreement. */
export class AdaptiveComplaintAgreementView {
  code: string;
  labelText: string;
  margin: string;
  variant: string;
  weight: string;
  pinned: string;
  thresholdText: string;
  durationMinutes: string;
  conversionRate: string;
  nameText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    margin: string,
    variant: string,
    weight: string,
    pinned: string,
    thresholdText: string,
    durationMinutes: string,
    conversionRate: string,
    nameText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.margin = margin;
    this.variant = variant;
    this.weight = weight;
    this.pinned = pinned;
    this.thresholdText = thresholdText;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.nameText = nameText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveComplaintAgreementView(item: AdaptiveComplaintAgreement): AdaptiveComplaintAgreementView {
  return new AdaptiveComplaintAgreementView(
    text.truncate(item.code, 40),
    item.label,
    item.margin.toFixed(2),
    text.truncate(item.variant, 120),
    item.weight.toFixed(2),
    `${item.pinned}`,
    item.threshold.toFixed(2),
    String(item.durationMinutes),
    item.conversionRate.toFixed(2),
    item.name,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveComplaintAgreementViews(items: AdaptiveComplaintAgreement[]): AdaptiveComplaintAgreementView[] {
  const views: AdaptiveComplaintAgreementView[] = [];
  for (const item of items) {
    views.push(toAdaptiveComplaintAgreementView(item));
  }
  return views;
}

export function sumAdaptiveComplaintAgreementView(view: AdaptiveComplaintAgreementView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedMargin + parsedWeight + parsedThreshold;
}
