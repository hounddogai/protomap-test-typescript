import * as text from "../../../../kit/text.js";
import { BatchedPreferenceRequest } from "./batched-preference-request.js";

/** How screens and exports show a batched preference request. */
export class BatchedPreferenceRequestView {
  code: string;
  name: string;
  rate: string;
  localeText: string;
  minimum: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    localeText: string,
    minimum: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.localeText = localeText;
    this.minimum = minimum;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPreferenceRequestView(item: BatchedPreferenceRequest): BatchedPreferenceRequestView {
  return new BatchedPreferenceRequestView(
    text.truncate(item.code, 80),
    item.name,
    item.rate.toFixed(2),
    item.locale,
    item.minimum.toFixed(2),
    text.truncate(item.label, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPreferenceRequestViews(items: BatchedPreferenceRequest[]): BatchedPreferenceRequestView[] {
  const views: BatchedPreferenceRequestView[] = [];
  for (const item of items) {
    views.push(toBatchedPreferenceRequestView(item));
  }
  return views;
}

export function sumBatchedPreferenceRequestView(view: BatchedPreferenceRequestView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedRate + parsedMinimum;
}
