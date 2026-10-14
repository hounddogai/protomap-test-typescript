import { StrictCohortDraft } from "./strict-cohort-draft.js";

/** How screens and exports show a strict cohort draft. */
export class StrictCohortDraftView {
  code: string;
  label: string;
  conversionRate: string;
  limitText: string;
  startsAtText: string;
  cost: string;
  batchSize: string;
  rateText: string;
  phoneText: string;
  contactEmail: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    conversionRate: string,
    limitText: string,
    startsAtText: string,
    cost: string,
    batchSize: string,
    rateText: string,
    phoneText: string,
    contactEmail: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.limitText = limitText;
    this.startsAtText = startsAtText;
    this.cost = cost;
    this.batchSize = batchSize;
    this.rateText = rateText;
    this.phoneText = phoneText;
    this.contactEmail = contactEmail;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCohortDraftView(item: StrictCohortDraft): StrictCohortDraftView {
  return new StrictCohortDraftView(
    item.code,
    item.label,
    item.conversionRate.toFixed(2),
    String(item.limit),
    String(item.startsAt),
    item.cost.toFixed(2),
    String(item.batchSize),
    item.rate.toFixed(2),
    item.phone,
    item.contactEmail,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCohortDraftViews(items: StrictCohortDraft[]): StrictCohortDraftView[] {
  const views: StrictCohortDraftView[] = [];
  for (const item of items) {
    views.push(toStrictCohortDraftView(item));
  }
  return views;
}

export function sumStrictCohortDraftView(view: StrictCohortDraftView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedConversionRate + parsedLimit + parsedStartsAt;
}
