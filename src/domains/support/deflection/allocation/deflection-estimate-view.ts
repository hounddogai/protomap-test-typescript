import * as text from "../../../../kit/text.js";
import { DeflectionEstimate } from "./deflection-estimate.js";

/** How screens and exports show a deflection estimate. */
export class DeflectionEstimateView {
  code: string;
  labelText: string;
  titleText: string;
  retries: string;
  visibleText: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    titleText: string,
    retries: string,
    visibleText: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.titleText = titleText;
    this.retries = retries;
    this.visibleText = visibleText;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionEstimateView(item: DeflectionEstimate): DeflectionEstimateView {
  return new DeflectionEstimateView(
    text.truncate(item.code, 64),
    item.label,
    text.truncate(item.title, 120),
    String(item.retries),
    `${item.visible}`,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionEstimateViews(items: DeflectionEstimate[]): DeflectionEstimateView[] {
  const views: DeflectionEstimateView[] = [];
  for (const item of items) {
    views.push(toDeflectionEstimateView(item));
  }
  return views;
}

export function sumDeflectionEstimateView(view: DeflectionEstimateView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedRetries + parsedEndsAt;
}
