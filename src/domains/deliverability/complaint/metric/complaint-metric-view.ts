import * as text from "../../../../kit/text.js";
import { ComplaintMetric } from "./complaint-metric.js";

/** How screens and exports show a complaint metric. */
export class ComplaintMetricView {
  code: string;
  nameText: string;
  campaignRefText: string;
  frequencyCapText: string;
  activeText: string;
  externalRefText: string;
  rateText: string;
  floorValue: string;
  unitText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    campaignRefText: string,
    frequencyCapText: string,
    activeText: string,
    externalRefText: string,
    rateText: string,
    floorValue: string,
    unitText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.campaignRefText = campaignRefText;
    this.frequencyCapText = frequencyCapText;
    this.activeText = activeText;
    this.externalRefText = externalRefText;
    this.rateText = rateText;
    this.floorValue = floorValue;
    this.unitText = unitText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintMetricView(item: ComplaintMetric): ComplaintMetricView {
  return new ComplaintMetricView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 40),
    item.campaignRef,
    String(item.frequencyCap),
    `${item.active}`,
    item.externalRef,
    item.rate.toFixed(2),
    item.floorValue.toFixed(2),
    text.truncate(item.unit, 120),
    text.truncate(item.variant, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintMetricViews(items: ComplaintMetric[]): ComplaintMetricView[] {
  const views: ComplaintMetricView[] = [];
  for (const item of items) {
    views.push(toComplaintMetricView(item));
  }
  return views;
}

export function sumComplaintMetricView(view: ComplaintMetricView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedFrequencyCap + parsedRate + parsedFloorValue;
}
