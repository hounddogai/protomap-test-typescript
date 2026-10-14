import * as text from "../../../../kit/text.js";
import { DoubleOptInTemplate } from "./double-opt-in-template.js";

/** How screens and exports show a double opt in template. */
export class DoubleOptInTemplateView {
  code: string;
  title: string;
  batchSizeText: string;
  label: string;
  approved: string;
  startsAtText: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSizeText: string,
    label: string,
    approved: string,
    startsAtText: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSizeText = batchSizeText;
    this.label = label;
    this.approved = approved;
    this.startsAtText = startsAtText;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInTemplateView(item: DoubleOptInTemplate): DoubleOptInTemplateView {
  return new DoubleOptInTemplateView(
    item.code,
    text.truncate(item.title, 120),
    String(item.batchSize),
    text.truncate(item.label, 80),
    `${item.approved}`,
    String(item.startsAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInTemplateViews(items: DoubleOptInTemplate[]): DoubleOptInTemplateView[] {
  const views: DoubleOptInTemplateView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInTemplateView(item));
  }
  return views;
}

export function sumDoubleOptInTemplateView(view: DoubleOptInTemplateView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBatchSize + parsedStartsAt + parsedClicks;
}
