import * as text from "../../../../kit/text.js";
import { JourneyPolicy } from "./journey-policy.js";

/** How screens and exports show a journey policy. */
export class JourneyPolicyView {
  code: string;
  name: string;
  cohort: string;
  rate: string;
  endsAt: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cohort: string,
    rate: string,
    endsAt: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.rate = rate;
    this.endsAt = endsAt;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyPolicyView(item: JourneyPolicy): JourneyPolicyView {
  return new JourneyPolicyView(
    item.code,
    item.name,
    text.truncate(item.cohort, 80),
    item.rate.toFixed(2),
    String(item.endsAt),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyPolicyViews(items: JourneyPolicy[]): JourneyPolicyView[] {
  const views: JourneyPolicyView[] = [];
  for (const item of items) {
    views.push(toJourneyPolicyView(item));
  }
  return views;
}

export function sumJourneyPolicyView(view: JourneyPolicyView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedRate + parsedEndsAt + parsedImpressions;
}
