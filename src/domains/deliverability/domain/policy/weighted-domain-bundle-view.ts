import * as text from "../../../../kit/text.js";
import { WeightedDomainBundle } from "./weighted-domain-bundle.js";

/** How screens and exports show a weighted domain bundle. */
export class WeightedDomainBundleView {
  code: string;
  title: string;
  journeyId: string;
  region: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    region: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.region = region;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedDomainBundleView(item: WeightedDomainBundle): WeightedDomainBundleView {
  return new WeightedDomainBundleView(
    item.code,
    text.truncate(item.title, 120),
    item.journeyId,
    item.region,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedDomainBundleViews(items: WeightedDomainBundle[]): WeightedDomainBundleView[] {
  const views: WeightedDomainBundleView[] = [];
  for (const item of items) {
    views.push(toWeightedDomainBundleView(item));
  }
  return views;
}

export function sumWeightedDomainBundleView(view: WeightedDomainBundleView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
