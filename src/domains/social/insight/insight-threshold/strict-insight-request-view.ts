import { StrictInsightRequest } from "./strict-insight-request.js";

/** How screens and exports show a strict insight request. */
export class StrictInsightRequestView {
  code: string;
  titleText: string;
  frequencyCap: string;
  maximum: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    frequencyCap: string,
    maximum: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toStrictInsightRequestView(item: StrictInsightRequest): StrictInsightRequestView {
  return new StrictInsightRequestView(
    item.code,
    item.title,
    String(item.frequencyCap),
    item.maximum.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictInsightRequestViews(items: StrictInsightRequest[]): StrictInsightRequestView[] {
  const views: StrictInsightRequestView[] = [];
  for (const item of items) {
    views.push(toStrictInsightRequestView(item));
  }
  return views;
}

export function sumStrictInsightRequestView(view: StrictInsightRequestView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedFrequencyCap + parsedMaximum + parsedExpiresAt;
}
