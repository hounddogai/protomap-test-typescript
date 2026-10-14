import { FrequencyPolicy } from "./frequency-policy.js";

/** How screens and exports show a frequency policy. */
export class FrequencyPolicyView {
  code: string;
  title: string;
  windowDays: string;
  checksum: string;
  startsAt: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    checksum: string,
    startsAt: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.startsAt = startsAt;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyPolicyView(item: FrequencyPolicy): FrequencyPolicyView {
  return new FrequencyPolicyView(
    item.code,
    item.title,
    String(item.windowDays),
    item.checksum,
    String(item.startsAt),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyPolicyViews(items: FrequencyPolicy[]): FrequencyPolicyView[] {
  const views: FrequencyPolicyView[] = [];
  for (const item of items) {
    views.push(toFrequencyPolicyView(item));
  }
  return views;
}

export function sumFrequencyPolicyView(view: FrequencyPolicyView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedWindowDays + parsedStartsAt + parsedLimit;
}
