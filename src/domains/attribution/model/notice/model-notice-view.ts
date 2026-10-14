import * as text from "../../../../kit/text.js";
import { ModelNotice } from "./model-notice.js";

/** How screens and exports show a model notice. */
export class ModelNoticeView {
  code: string;
  labelText: string;
  utmSource: string;
  cost: string;
  archivedText: string;
  impressions: string;
  weight: string;
  attempts: string;
  batchSizeText: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    utmSource: string,
    cost: string,
    archivedText: string,
    impressions: string,
    weight: string,
    attempts: string,
    batchSizeText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.utmSource = utmSource;
    this.cost = cost;
    this.archivedText = archivedText;
    this.impressions = impressions;
    this.weight = weight;
    this.attempts = attempts;
    this.batchSizeText = batchSizeText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toModelNoticeView(item: ModelNotice): ModelNoticeView {
  return new ModelNoticeView(
    item.code,
    text.truncate(item.label, 64),
    item.utmSource,
    item.cost.toFixed(2),
    `${item.archived}`,
    String(item.impressions),
    item.weight.toFixed(2),
    String(item.attempts),
    String(item.batchSize),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelNoticeViews(items: ModelNotice[]): ModelNoticeView[] {
  const views: ModelNoticeView[] = [];
  for (const item of items) {
    views.push(toModelNoticeView(item));
  }
  return views;
}

export function sumModelNoticeView(view: ModelNoticeView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedCost + parsedImpressions + parsedWeight;
}
