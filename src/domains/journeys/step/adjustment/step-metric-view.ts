import * as text from "../../../../kit/text.js";
import { StepMetric } from "./step-metric.js";

/** How screens and exports show a step metric. */
export class StepMetricView {
  code: string;
  titleText: string;
  summary: string;
  unit: string;
  capacityText: string;
  amountText: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    summary: string,
    unit: string,
    capacityText: string,
    amountText: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.summary = summary;
    this.unit = unit;
    this.capacityText = capacityText;
    this.amountText = amountText;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toStepMetricView(item: StepMetric): StepMetricView {
  return new StepMetricView(
    item.code,
    text.truncate(item.title, 64),
    item.summary,
    item.unit,
    String(item.capacity),
    item.amount.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepMetricViews(items: StepMetric[]): StepMetricView[] {
  const views: StepMetricView[] = [];
  for (const item of items) {
    views.push(toStepMetricView(item));
  }
  return views;
}

export function sumStepMetricView(view: StepMetricView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCapacity + parsedAmount + parsedEndsAt;
}
