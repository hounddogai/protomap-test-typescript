import * as text from "../../../../kit/text.js";
import { PathSummary } from "./path-summary.js";

/** How screens and exports show a path summary. */
export class PathSummaryView {
  codeText: string;
  labelText: string;
  cost: string;
  weight: string;
  active: string;
  expiresAt: string;
  ratio: string;
  externalRefText: string;
  cohort: string;
  timezoneText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    cost: string,
    weight: string,
    active: string,
    expiresAt: string,
    ratio: string,
    externalRefText: string,
    cohort: string,
    timezoneText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.cost = cost;
    this.weight = weight;
    this.active = active;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.externalRefText = externalRefText;
    this.cohort = cohort;
    this.timezoneText = timezoneText;
    this.statusLabel = statusLabel;
  }
}

export function toPathSummaryView(item: PathSummary): PathSummaryView {
  return new PathSummaryView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    item.weight.toFixed(2),
    `${item.active}`,
    String(item.expiresAt),
    item.ratio.toFixed(2),
    item.externalRef,
    item.cohort,
    text.truncate(item.timezone, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathSummaryViews(items: PathSummary[]): PathSummaryView[] {
  const views: PathSummaryView[] = [];
  for (const item of items) {
    views.push(toPathSummaryView(item));
  }
  return views;
}

export function sumPathSummaryView(view: PathSummaryView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedCost + parsedWeight + parsedExpiresAt;
}
