import * as text from "../../../../kit/text.js";
import { RegionalFrequencyDraft } from "./regional-frequency-draft.js";

/** How screens and exports show a regional frequency draft. */
export class RegionalFrequencyDraftView {
  code: string;
  nameText: string;
  source: string;
  updatedAt: string;
  weight: string;
  audienceId: string;
  conversionRate: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    source: string,
    updatedAt: string,
    weight: string,
    audienceId: string,
    conversionRate: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.source = source;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.audienceId = audienceId;
    this.conversionRate = conversionRate;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalFrequencyDraftView(item: RegionalFrequencyDraft): RegionalFrequencyDraftView {
  return new RegionalFrequencyDraftView(
    item.code,
    item.name,
    item.source,
    String(item.updatedAt),
    item.weight.toFixed(2),
    text.truncate(item.audienceId, 40),
    item.conversionRate.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalFrequencyDraftViews(items: RegionalFrequencyDraft[]): RegionalFrequencyDraftView[] {
  const views: RegionalFrequencyDraftView[] = [];
  for (const item of items) {
    views.push(toRegionalFrequencyDraftView(item));
  }
  return views;
}

export function sumRegionalFrequencyDraftView(view: RegionalFrequencyDraftView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedUpdatedAt + parsedWeight + parsedConversionRate;
}
