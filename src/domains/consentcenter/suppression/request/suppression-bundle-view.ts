import * as text from "../../../../kit/text.js";
import { SuppressionBundle } from "./suppression-bundle.js";

/** How screens and exports show a suppression bundle. */
export class SuppressionBundleView {
  code: string;
  name: string;
  timezone: string;
  rate: string;
  journeyIdText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    rate: string,
    journeyIdText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.rate = rate;
    this.journeyIdText = journeyIdText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionBundleView(item: SuppressionBundle): SuppressionBundleView {
  return new SuppressionBundleView(
    item.code,
    item.name,
    item.timezone,
    item.rate.toFixed(2),
    item.journeyId,
    text.truncate(item.contactEmail, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionBundleViews(items: SuppressionBundle[]): SuppressionBundleView[] {
  const views: SuppressionBundleView[] = [];
  for (const item of items) {
    views.push(toSuppressionBundleView(item));
  }
  return views;
}

export function sumSuppressionBundleView(view: SuppressionBundleView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
