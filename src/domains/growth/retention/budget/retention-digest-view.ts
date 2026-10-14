import { RetentionDigest } from "./retention-digest.js";

/** How screens and exports show a retention digest. */
export class RetentionDigestView {
  code: string;
  name: string;
  timezone: string;
  windowDays: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    windowDays: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionDigestView(item: RetentionDigest): RetentionDigestView {
  return new RetentionDigestView(
    item.code,
    item.name,
    item.timezone,
    String(item.windowDays),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionDigestViews(items: RetentionDigest[]): RetentionDigestView[] {
  const views: RetentionDigestView[] = [];
  for (const item of items) {
    views.push(toRetentionDigestView(item));
  }
  return views;
}

export function sumRetentionDigestView(view: RetentionDigestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedWindowDays + parsedWeight;
}
