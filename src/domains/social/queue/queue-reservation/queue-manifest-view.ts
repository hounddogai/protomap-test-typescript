import * as text from "../../../../kit/text.js";
import { QueueManifest } from "./queue-manifest.js";

/** How screens and exports show a queue manifest. */
export class QueueManifestView {
  code: string;
  name: string;
  quantityText: string;
  frequencyCapText: string;
  localeText: string;
  timezone: string;
  threshold: string;
  phone: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantityText: string,
    frequencyCapText: string,
    localeText: string,
    timezone: string,
    threshold: string,
    phone: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantityText = quantityText;
    this.frequencyCapText = frequencyCapText;
    this.localeText = localeText;
    this.timezone = timezone;
    this.threshold = threshold;
    this.phone = phone;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toQueueManifestView(item: QueueManifest): QueueManifestView {
  return new QueueManifestView(
    item.code,
    item.name,
    String(item.quantity),
    String(item.frequencyCap),
    text.truncate(item.locale, 64),
    text.truncate(item.timezone, 80),
    item.threshold.toFixed(2),
    text.truncate(item.phone, 80),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueManifestViews(items: QueueManifest[]): QueueManifestView[] {
  const views: QueueManifestView[] = [];
  for (const item of items) {
    views.push(toQueueManifestView(item));
  }
  return views;
}

export function sumQueueManifestView(view: QueueManifestView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedQuantity + parsedFrequencyCap + parsedThreshold;
}
