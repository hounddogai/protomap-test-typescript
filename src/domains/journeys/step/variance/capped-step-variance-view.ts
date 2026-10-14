import * as text from "../../../../kit/text.js";
import { CappedStepVariance } from "./capped-step-variance.js";

/** How screens and exports show a capped step variance. */
export class CappedStepVarianceView {
  codeText: string;
  title: string;
  startsAt: string;
  retries: string;
  description: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    startsAt: string,
    retries: string,
    description: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.startsAt = startsAt;
    this.retries = retries;
    this.description = description;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toCappedStepVarianceView(item: CappedStepVariance): CappedStepVarianceView {
  return new CappedStepVarianceView(
    item.code,
    item.title,
    String(item.startsAt),
    String(item.retries),
    text.truncate(item.description, 64),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedStepVarianceViews(items: CappedStepVariance[]): CappedStepVarianceView[] {
  const views: CappedStepVarianceView[] = [];
  for (const item of items) {
    views.push(toCappedStepVarianceView(item));
  }
  return views;
}

export function sumCappedStepVarianceView(view: CappedStepVarianceView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedStartsAt + parsedRetries + parsedQuantity;
}
