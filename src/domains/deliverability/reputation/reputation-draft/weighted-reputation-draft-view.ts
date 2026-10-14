import * as text from "../../../../kit/text.js";
import { WeightedReputationDraft } from "./weighted-reputation-draft.js";

/** How screens and exports show a weighted reputation draft. */
export class WeightedReputationDraftView {
  code: string;
  name: string;
  cohort: string;
  budget: string;
  localeText: string;
  ratioText: string;
  sequence: string;
  summary: string;
  windowDays: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cohort: string,
    budget: string,
    localeText: string,
    ratioText: string,
    sequence: string,
    summary: string,
    windowDays: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.budget = budget;
    this.localeText = localeText;
    this.ratioText = ratioText;
    this.sequence = sequence;
    this.summary = summary;
    this.windowDays = windowDays;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReputationDraftView(item: WeightedReputationDraft): WeightedReputationDraftView {
  return new WeightedReputationDraftView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 40),
    text.truncate(item.cohort, 120),
    item.budget.toFixed(2),
    item.locale,
    item.ratio.toFixed(2),
    String(item.sequence),
    item.summary,
    String(item.windowDays),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReputationDraftViews(items: WeightedReputationDraft[]): WeightedReputationDraftView[] {
  const views: WeightedReputationDraftView[] = [];
  for (const item of items) {
    views.push(toWeightedReputationDraftView(item));
  }
  return views;
}

export function sumWeightedReputationDraftView(view: WeightedReputationDraftView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedBudget + parsedRatio + parsedSequence;
}
