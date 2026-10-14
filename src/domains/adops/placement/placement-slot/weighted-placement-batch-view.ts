import { WeightedPlacementBatch } from "./weighted-placement-batch.js";

/** How screens and exports show a weighted placement batch. */
export class WeightedPlacementBatchView {
  code: string;
  title: string;
  unit: string;
  locale: string;
  openRate: string;
  segment: string;
  frequencyCap: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    unit: string,
    locale: string,
    openRate: string,
    segment: string,
    frequencyCap: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.locale = locale;
    this.openRate = openRate;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPlacementBatchView(item: WeightedPlacementBatch): WeightedPlacementBatchView {
  return new WeightedPlacementBatchView(
    item.code,
    item.title,
    item.unit,
    item.locale,
    item.openRate.toFixed(2),
    item.segment,
    String(item.frequencyCap),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPlacementBatchViews(items: WeightedPlacementBatch[]): WeightedPlacementBatchView[] {
  const views: WeightedPlacementBatchView[] = [];
  for (const item of items) {
    views.push(toWeightedPlacementBatchView(item));
  }
  return views;
}

export function sumWeightedPlacementBatchView(view: WeightedPlacementBatchView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedOpenRate + parsedFrequencyCap;
}
