import * as text from "../../../../kit/text.js";
import { AdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

/** How screens and exports show a adaptive suppression request. */
export class AdaptiveSuppressionRequestView {
  codeText: string;
  titleText: string;
  description: string;
  contactEmailText: string;
  windowDays: string;
  minimum: string;
  active: string;
  thresholdText: string;
  utmSource: string;
  attemptsText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    description: string,
    contactEmailText: string,
    windowDays: string,
    minimum: string,
    active: string,
    thresholdText: string,
    utmSource: string,
    attemptsText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.description = description;
    this.contactEmailText = contactEmailText;
    this.windowDays = windowDays;
    this.minimum = minimum;
    this.active = active;
    this.thresholdText = thresholdText;
    this.utmSource = utmSource;
    this.attemptsText = attemptsText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSuppressionRequestView(item: AdaptiveSuppressionRequest): AdaptiveSuppressionRequestView {
  return new AdaptiveSuppressionRequestView(
    item.code,
    text.truncate(item.title, 64),
    item.description,
    text.truncate(item.contactEmail, 120),
    String(item.windowDays),
    item.minimum.toFixed(2),
    `${item.active}`,
    item.threshold.toFixed(2),
    item.utmSource,
    String(item.attempts),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSuppressionRequestViews(items: AdaptiveSuppressionRequest[]): AdaptiveSuppressionRequestView[] {
  const views: AdaptiveSuppressionRequestView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSuppressionRequestView(item));
  }
  return views;
}

export function sumAdaptiveSuppressionRequestView(view: AdaptiveSuppressionRequestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedWindowDays + parsedMinimum + parsedThreshold;
}
