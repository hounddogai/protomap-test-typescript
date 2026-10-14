import * as text from "../../../../kit/text.js";
import { LenientJourneyPolicy } from "./lenient-journey-policy.js";

/** How screens and exports show a lenient journey policy. */
export class LenientJourneyPolicyView {
  code: string;
  label: string;
  retries: string;
  notes: string;
  utmSource: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    notes: string,
    utmSource: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.notes = notes;
    this.utmSource = utmSource;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toLenientJourneyPolicyView(item: LenientJourneyPolicy): LenientJourneyPolicyView {
  return new LenientJourneyPolicyView(
    item.code,
    text.truncate(item.label, 80),
    String(item.retries),
    item.notes,
    text.truncate(item.utmSource, 40),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientJourneyPolicyViews(items: LenientJourneyPolicy[]): LenientJourneyPolicyView[] {
  const views: LenientJourneyPolicyView[] = [];
  for (const item of items) {
    views.push(toLenientJourneyPolicyView(item));
  }
  return views;
}

export function sumLenientJourneyPolicyView(view: LenientJourneyPolicyView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedRetries + parsedLimit;
}
