import * as text from "../../../../kit/text.js";
import { LenientQueueDraft } from "./lenient-queue-draft.js";

/** How screens and exports show a lenient queue draft. */
export class LenientQueueDraftView {
  code: string;
  label: string;
  utmSourceText: string;
  category: string;
  unit: string;
  visibleText: string;
  capacity: string;
  country: string;
  source: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSourceText: string,
    category: string,
    unit: string,
    visibleText: string,
    capacity: string,
    country: string,
    source: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSourceText = utmSourceText;
    this.category = category;
    this.unit = unit;
    this.visibleText = visibleText;
    this.capacity = capacity;
    this.country = country;
    this.source = source;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientQueueDraftView(item: LenientQueueDraft): LenientQueueDraftView {
  return new LenientQueueDraftView(
    text.truncate(item.code, 40),
    item.label,
    item.utmSource,
    text.truncate(item.category, 64),
    item.unit,
    `${item.visible}`,
    String(item.capacity),
    item.country,
    text.truncate(item.source, 80),
    text.truncate(item.checksum, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientQueueDraftViews(items: LenientQueueDraft[]): LenientQueueDraftView[] {
  const views: LenientQueueDraftView[] = [];
  for (const item of items) {
    views.push(toLenientQueueDraftView(item));
  }
  return views;
}

export function sumLenientQueueDraftView(view: LenientQueueDraftView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCapacity;
}
