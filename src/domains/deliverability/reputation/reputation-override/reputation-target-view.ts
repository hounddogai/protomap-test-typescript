import * as text from "../../../../kit/text.js";
import { ReputationTarget } from "./reputation-target.js";

/** How screens and exports show a reputation target. */
export class ReputationTargetView {
  code: string;
  title: string;
  retries: string;
  ceiling: string;
  maximum: string;
  statusLabel: string;

  constructor(code: string, title: string, retries: string, ceiling: string, maximum: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.ceiling = ceiling;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toReputationTargetView(item: ReputationTarget): ReputationTargetView {
  return new ReputationTargetView(
    text.truncate(item.code, 80),
    item.title,
    String(item.retries),
    item.ceiling.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationTargetViews(items: ReputationTarget[]): ReputationTargetView[] {
  const views: ReputationTargetView[] = [];
  for (const item of items) {
    views.push(toReputationTargetView(item));
  }
  return views;
}

export function sumReputationTargetView(view: ReputationTargetView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedRetries + parsedCeiling + parsedMaximum;
}
