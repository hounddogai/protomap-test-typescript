import * as text from "../../../../kit/text.js";
import { ManualSlaDigest } from "./manual-sla-digest.js";

/** How screens and exports show a manual sla digest. */
export class ManualSlaDigestView {
  code: string;
  title: string;
  notesText: string;
  reviewer: string;
  utmSource: string;
  description: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    notesText: string,
    reviewer: string,
    utmSource: string,
    description: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.notesText = notesText;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.description = description;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toManualSlaDigestView(item: ManualSlaDigest): ManualSlaDigestView {
  return new ManualSlaDigestView(
    item.code,
    item.title,
    text.truncate(item.notes, 80),
    text.truncate(item.reviewer, 120),
    item.utmSource,
    item.description,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualSlaDigestViews(items: ManualSlaDigest[]): ManualSlaDigestView[] {
  const views: ManualSlaDigestView[] = [];
  for (const item of items) {
    views.push(toManualSlaDigestView(item));
  }
  return views;
}

export function sumManualSlaDigestView(view: ManualSlaDigestView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
