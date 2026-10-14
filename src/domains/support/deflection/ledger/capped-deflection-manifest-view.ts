import { CappedDeflectionManifest } from "./capped-deflection-manifest.js";

/** How screens and exports show a capped deflection manifest. */
export class CappedDeflectionManifestView {
  code: string;
  title: string;
  archivedText: string;
  amountText: string;
  timezoneText: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archivedText: string,
    amountText: string,
    timezoneText: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archivedText = archivedText;
    this.amountText = amountText;
    this.timezoneText = timezoneText;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toCappedDeflectionManifestView(item: CappedDeflectionManifest): CappedDeflectionManifestView {
  return new CappedDeflectionManifestView(
    item.code,
    item.title,
    `${item.archived}`,
    item.amount.toFixed(2),
    item.timezone,
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedDeflectionManifestViews(items: CappedDeflectionManifest[]): CappedDeflectionManifestView[] {
  const views: CappedDeflectionManifestView[] = [];
  for (const item of items) {
    views.push(toCappedDeflectionManifestView(item));
  }
  return views;
}

export function sumCappedDeflectionManifestView(view: CappedDeflectionManifestView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
