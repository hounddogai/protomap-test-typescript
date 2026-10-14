import * as text from "../../../../kit/text.js";
import { SlaDigest } from "./sla-digest.js";

/** How screens and exports show a sla digest. */
export class SlaDigestView {
  codeText: string;
  label: string;
  notesText: string;
  title: string;
  graceDays: string;
  reviewer: string;
  discountText: string;
  openRate: string;
  rateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    notesText: string,
    title: string,
    graceDays: string,
    reviewer: string,
    discountText: string,
    openRate: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.notesText = notesText;
    this.title = title;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.discountText = discountText;
    this.openRate = openRate;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaDigestView(item: SlaDigest): SlaDigestView {
  return new SlaDigestView(
    text.truncate(item.code, 120),
    item.label,
    item.notes,
    item.title,
    String(item.graceDays),
    item.reviewer,
    item.discount.toFixed(2),
    item.openRate.toFixed(2),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaDigestViews(items: SlaDigest[]): SlaDigestView[] {
  const views: SlaDigestView[] = [];
  for (const item of items) {
    views.push(toSlaDigestView(item));
  }
  return views;
}

export function sumSlaDigestView(view: SlaDigestView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedGraceDays + parsedDiscount + parsedOpenRate;
}
