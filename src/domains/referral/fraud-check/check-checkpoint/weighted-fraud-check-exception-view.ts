import * as text from "../../../../kit/text.js";
import { WeightedFraudCheckException } from "./weighted-fraud-check-exception.js";

/** How screens and exports show a weighted fraud check exception. */
export class WeightedFraudCheckExceptionView {
  code: string;
  title: string;
  createdAtText: string;
  margin: string;
  statusLabel: string;

  constructor(code: string, title: string, createdAtText: string, margin: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.createdAtText = createdAtText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedFraudCheckExceptionView(item: WeightedFraudCheckException): WeightedFraudCheckExceptionView {
  return new WeightedFraudCheckExceptionView(
    item.code,
    text.truncate(item.title, 64),
    String(item.createdAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedFraudCheckExceptionViews(items: WeightedFraudCheckException[]): WeightedFraudCheckExceptionView[] {
  const views: WeightedFraudCheckExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedFraudCheckExceptionView(item));
  }
  return views;
}

export function sumWeightedFraudCheckExceptionView(view: WeightedFraudCheckExceptionView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedCreatedAt + parsedMargin;
}
