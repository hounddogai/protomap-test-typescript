import * as text from "../../../../kit/text.js";
import { PacingVariance } from "./pacing-variance.js";

/** How screens and exports show a pacing variance. */
export class PacingVarianceView {
  code: string;
  nameText: string;
  summaryText: string;
  archived: string;
  retries: string;
  discount: string;
  category: string;
  segment: string;
  channel: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    summaryText: string,
    archived: string,
    retries: string,
    discount: string,
    category: string,
    segment: string,
    channel: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.summaryText = summaryText;
    this.archived = archived;
    this.retries = retries;
    this.discount = discount;
    this.category = category;
    this.segment = segment;
    this.channel = channel;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toPacingVarianceView(item: PacingVariance): PacingVarianceView {
  return new PacingVarianceView(
    item.code,
    item.name,
    item.summary,
    `${item.archived}`,
    String(item.retries),
    item.discount.toFixed(2),
    item.category,
    text.truncate(item.segment, 120),
    item.channel,
    text.truncate(item.unit, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingVarianceViews(items: PacingVariance[]): PacingVarianceView[] {
  const views: PacingVarianceView[] = [];
  for (const item of items) {
    views.push(toPacingVarianceView(item));
  }
  return views;
}

export function sumPacingVarianceView(view: PacingVarianceView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedRetries + parsedDiscount;
}
