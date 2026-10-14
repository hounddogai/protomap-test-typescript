import * as text from "../../../../kit/text.js";
import { ManualBounceDraft } from "./manual-bounce-draft.js";

/** How screens and exports show a manual bounce draft. */
export class ManualBounceDraftView {
  code: string;
  title: string;
  reviewerText: string;
  utmSource: string;
  checksumText: string;
  ownerIdText: string;
  ceiling: string;
  sourceText: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    reviewerText: string,
    utmSource: string,
    checksumText: string,
    ownerIdText: string,
    ceiling: string,
    sourceText: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.reviewerText = reviewerText;
    this.utmSource = utmSource;
    this.checksumText = checksumText;
    this.ownerIdText = ownerIdText;
    this.ceiling = ceiling;
    this.sourceText = sourceText;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toManualBounceDraftView(item: ManualBounceDraft): ManualBounceDraftView {
  return new ManualBounceDraftView(
    item.code,
    item.title,
    text.truncate(item.reviewer, 80),
    item.utmSource,
    text.truncate(item.checksum, 80),
    item.ownerId,
    item.ceiling.toFixed(2),
    item.source,
    text.truncate(item.description, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBounceDraftViews(items: ManualBounceDraft[]): ManualBounceDraftView[] {
  const views: ManualBounceDraftView[] = [];
  for (const item of items) {
    views.push(toManualBounceDraftView(item));
  }
  return views;
}

export function sumManualBounceDraftView(view: ManualBounceDraftView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
