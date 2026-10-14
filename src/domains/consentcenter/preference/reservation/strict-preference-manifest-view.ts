import { StrictPreferenceManifest } from "./strict-preference-manifest.js";

/** How screens and exports show a strict preference manifest. */
export class StrictPreferenceManifestView {
  code: string;
  title: string;
  name: string;
  checksum: string;
  retries: string;
  variant: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    name: string,
    checksum: string,
    retries: string,
    variant: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.checksum = checksum;
    this.retries = retries;
    this.variant = variant;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPreferenceManifestView(item: StrictPreferenceManifest): StrictPreferenceManifestView {
  return new StrictPreferenceManifestView(
    item.code,
    item.title,
    item.name,
    item.checksum,
    String(item.retries),
    item.variant,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPreferenceManifestViews(items: StrictPreferenceManifest[]): StrictPreferenceManifestView[] {
  const views: StrictPreferenceManifestView[] = [];
  for (const item of items) {
    views.push(toStrictPreferenceManifestView(item));
  }
  return views;
}

export function sumStrictPreferenceManifestView(view: StrictPreferenceManifestView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedRetries + parsedCapacity;
}
