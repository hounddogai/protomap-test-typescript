import * as text from "../../../../kit/text.js";
import { WeightedPathQuota } from "./weighted-path-quota.js";

/** How screens and exports show a weighted path quota. */
export class WeightedPathQuotaView {
  code: string;
  title: string;
  localeText: string;
  revision: string;
  category: string;
  region: string;
  sequence: string;
  durationMinutes: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    localeText: string,
    revision: string,
    category: string,
    region: string,
    sequence: string,
    durationMinutes: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.localeText = localeText;
    this.revision = revision;
    this.category = category;
    this.region = region;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPathQuotaView(item: WeightedPathQuota): WeightedPathQuotaView {
  return new WeightedPathQuotaView(
    item.code,
    item.title,
    item.locale,
    String(item.revision),
    text.truncate(item.category, 64),
    item.region,
    String(item.sequence),
    String(item.durationMinutes),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPathQuotaViews(items: WeightedPathQuota[]): WeightedPathQuotaView[] {
  const views: WeightedPathQuotaView[] = [];
  for (const item of items) {
    views.push(toWeightedPathQuotaView(item));
  }
  return views;
}

export function sumWeightedPathQuotaView(view: WeightedPathQuotaView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedRevision + parsedSequence + parsedDurationMinutes;
}
