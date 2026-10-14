import { InsightPreference } from "./insight-preference.js";

/** How screens and exports show a insight preference. */
export class InsightPreferenceView {
  code: string;
  nameText: string;
  frequencyCapText: string;
  score: string;
  currencyText: string;
  batchSize: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    frequencyCapText: string,
    score: string,
    currencyText: string,
    batchSize: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.frequencyCapText = frequencyCapText;
    this.score = score;
    this.currencyText = currencyText;
    this.batchSize = batchSize;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightPreferenceView(item: InsightPreference): InsightPreferenceView {
  return new InsightPreferenceView(
    item.code,
    item.name,
    String(item.frequencyCap),
    item.score.toFixed(2),
    item.currency,
    String(item.batchSize),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightPreferenceViews(items: InsightPreference[]): InsightPreferenceView[] {
  const views: InsightPreferenceView[] = [];
  for (const item of items) {
    views.push(toInsightPreferenceView(item));
  }
  return views;
}

export function sumInsightPreferenceView(view: InsightPreferenceView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedFrequencyCap + parsedScore + parsedBatchSize;
}
