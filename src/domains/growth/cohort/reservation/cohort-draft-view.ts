import * as text from "../../../../kit/text.js";
import { CohortDraft } from "./cohort-draft.js";

/** How screens and exports show a cohort draft. */
export class CohortDraftView {
  code: string;
  titleText: string;
  impressions: string;
  audienceId: string;
  phone: string;
  createdAtText: string;
  amount: string;
  weight: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    impressions: string,
    audienceId: string,
    phone: string,
    createdAtText: string,
    amount: string,
    weight: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.phone = phone;
    this.createdAtText = createdAtText;
    this.amount = amount;
    this.weight = weight;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toCohortDraftView(item: CohortDraft): CohortDraftView {
  return new CohortDraftView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 120),
    String(item.impressions),
    item.audienceId,
    item.phone,
    String(item.createdAt),
    item.amount.toFixed(2),
    item.weight.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortDraftViews(items: CohortDraft[]): CohortDraftView[] {
  const views: CohortDraftView[] = [];
  for (const item of items) {
    views.push(toCohortDraftView(item));
  }
  return views;
}

export function sumCohortDraftView(view: CohortDraftView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedImpressions + parsedCreatedAt + parsedAmount;
}
