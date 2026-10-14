import * as text from "../../../../kit/text.js";
import { LenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

/** How screens and exports show a lenient touchpoint variance. */
export class LenientTouchpointVarianceView {
  codeText: string;
  name: string;
  updatedAtText: string;
  archived: string;
  active: string;
  rate: string;
  budget: string;
  cohort: string;
  contactEmail: string;
  pinnedText: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    updatedAtText: string,
    archived: string,
    active: string,
    rate: string,
    budget: string,
    cohort: string,
    contactEmail: string,
    pinnedText: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.updatedAtText = updatedAtText;
    this.archived = archived;
    this.active = active;
    this.rate = rate;
    this.budget = budget;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.pinnedText = pinnedText;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientTouchpointVarianceView(item: LenientTouchpointVariance): LenientTouchpointVarianceView {
  return new LenientTouchpointVarianceView(
    text.truncate(item.code, 64),
    item.name,
    String(item.updatedAt),
    `${item.archived}`,
    `${item.active}`,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    text.truncate(item.cohort, 40),
    item.contactEmail,
    `${item.pinned}`,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientTouchpointVarianceViews(items: LenientTouchpointVariance[]): LenientTouchpointVarianceView[] {
  const views: LenientTouchpointVarianceView[] = [];
  for (const item of items) {
    views.push(toLenientTouchpointVarianceView(item));
  }
  return views;
}

export function sumLenientTouchpointVarianceView(view: LenientTouchpointVarianceView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedUpdatedAt + parsedRate + parsedBudget;
}
