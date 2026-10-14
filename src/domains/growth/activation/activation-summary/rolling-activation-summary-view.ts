import * as text from "../../../../kit/text.js";
import { RollingActivationSummary } from "./rolling-activation-summary.js";

/** How screens and exports show a rolling activation summary. */
export class RollingActivationSummaryView {
  code: string;
  name: string;
  externalRef: string;
  currency: string;
  clicks: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    currency: string,
    clicks: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.currency = currency;
    this.clicks = clicks;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toRollingActivationSummaryView(item: RollingActivationSummary): RollingActivationSummaryView {
  return new RollingActivationSummaryView(
    text.truncate(item.code, 64),
    item.name,
    text.truncate(item.externalRef, 40),
    item.currency,
    String(item.clicks),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingActivationSummaryViews(items: RollingActivationSummary[]): RollingActivationSummaryView[] {
  const views: RollingActivationSummaryView[] = [];
  for (const item of items) {
    views.push(toRollingActivationSummaryView(item));
  }
  return views;
}

export function sumRollingActivationSummaryView(view: RollingActivationSummaryView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedClicks;
}
