import * as text from "../../../../kit/text.js";
import { WindowEstimate } from "./window-estimate.js";

/** How screens and exports show a window estimate. */
export class WindowEstimateView {
  code: string;
  name: string;
  reviewer: string;
  labelText: string;
  version: string;
  active: string;
  retries: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    labelText: string,
    version: string,
    active: string,
    retries: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.labelText = labelText;
    this.version = version;
    this.active = active;
    this.retries = retries;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toWindowEstimateView(item: WindowEstimate): WindowEstimateView {
  return new WindowEstimateView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    item.reviewer,
    item.label,
    String(item.version),
    `${item.active}`,
    String(item.retries),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowEstimateViews(items: WindowEstimate[]): WindowEstimateView[] {
  const views: WindowEstimateView[] = [];
  for (const item of items) {
    views.push(toWindowEstimateView(item));
  }
  return views;
}

export function sumWindowEstimateView(view: WindowEstimateView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedVersion + parsedRetries;
}
