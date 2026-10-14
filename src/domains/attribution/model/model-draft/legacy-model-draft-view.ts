import * as text from "../../../../kit/text.js";
import { LegacyModelDraft } from "./legacy-model-draft.js";

/** How screens and exports show a legacy model draft. */
export class LegacyModelDraftView {
  code: string;
  title: string;
  durationMinutesText: string;
  label: string;
  budget: string;
  frequencyCapText: string;
  category: string;
  locale: string;
  clicks: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutesText: string,
    label: string,
    budget: string,
    frequencyCapText: string,
    category: string,
    locale: string,
    clicks: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutesText = durationMinutesText;
    this.label = label;
    this.budget = budget;
    this.frequencyCapText = frequencyCapText;
    this.category = category;
    this.locale = locale;
    this.clicks = clicks;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyModelDraftView(item: LegacyModelDraft): LegacyModelDraftView {
  return new LegacyModelDraftView(
    item.code,
    item.title,
    String(item.durationMinutes),
    text.truncate(item.label, 64),
    item.budget.toFixed(2),
    String(item.frequencyCap),
    item.category,
    item.locale,
    String(item.clicks),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyModelDraftViews(items: LegacyModelDraft[]): LegacyModelDraftView[] {
  const views: LegacyModelDraftView[] = [];
  for (const item of items) {
    views.push(toLegacyModelDraftView(item));
  }
  return views;
}

export function sumLegacyModelDraftView(view: LegacyModelDraftView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedDurationMinutes + parsedBudget + parsedFrequencyCap;
}
