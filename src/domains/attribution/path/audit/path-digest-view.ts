import { PathDigest } from "./path-digest.js";

/** How screens and exports show a path digest. */
export class PathDigestView {
  code: string;
  name: string;
  capacityText: string;
  campaignRefText: string;
  retriesText: string;
  phone: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacityText: string,
    campaignRefText: string,
    retriesText: string,
    phone: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacityText = capacityText;
    this.campaignRefText = campaignRefText;
    this.retriesText = retriesText;
    this.phone = phone;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toPathDigestView(item: PathDigest): PathDigestView {
  return new PathDigestView(
    item.code,
    item.name,
    String(item.capacity),
    item.campaignRef,
    String(item.retries),
    item.phone,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathDigestViews(items: PathDigest[]): PathDigestView[] {
  const views: PathDigestView[] = [];
  for (const item of items) {
    views.push(toPathDigestView(item));
  }
  return views;
}

export function sumPathDigestView(view: PathDigestView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedCapacity + parsedRetries + parsedLimit;
}
