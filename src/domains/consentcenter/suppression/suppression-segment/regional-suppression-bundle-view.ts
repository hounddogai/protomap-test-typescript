import * as text from "../../../../kit/text.js";
import { RegionalSuppressionBundle } from "./regional-suppression-bundle.js";

/** How screens and exports show a regional suppression bundle. */
export class RegionalSuppressionBundleView {
  codeText: string;
  titleText: string;
  durationMinutesText: string;
  weightText: string;
  costText: string;
  summary: string;
  checksum: string;
  amountText: string;
  startsAtText: string;
  label: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    durationMinutesText: string,
    weightText: string,
    costText: string,
    summary: string,
    checksum: string,
    amountText: string,
    startsAtText: string,
    label: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.durationMinutesText = durationMinutesText;
    this.weightText = weightText;
    this.costText = costText;
    this.summary = summary;
    this.checksum = checksum;
    this.amountText = amountText;
    this.startsAtText = startsAtText;
    this.label = label;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSuppressionBundleView(item: RegionalSuppressionBundle): RegionalSuppressionBundleView {
  return new RegionalSuppressionBundleView(
    item.code,
    item.title,
    String(item.durationMinutes),
    item.weight.toFixed(2),
    item.cost.toFixed(2),
    item.summary,
    item.checksum,
    item.amount.toFixed(2),
    String(item.startsAt),
    text.truncate(item.label, 120),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSuppressionBundleViews(items: RegionalSuppressionBundle[]): RegionalSuppressionBundleView[] {
  const views: RegionalSuppressionBundleView[] = [];
  for (const item of items) {
    views.push(toRegionalSuppressionBundleView(item));
  }
  return views;
}

export function sumRegionalSuppressionBundleView(view: RegionalSuppressionBundleView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedDurationMinutes + parsedWeight + parsedCost;
}
