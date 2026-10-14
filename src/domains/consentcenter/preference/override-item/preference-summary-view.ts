import { PreferenceSummary } from "./preference-summary.js";

/** How screens and exports show a preference summary. */
export class PreferenceSummaryView {
  codeText: string;
  name: string;
  archivedText: string;
  ownerId: string;
  checksum: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    archivedText: string,
    ownerId: string,
    checksum: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.archivedText = archivedText;
    this.ownerId = ownerId;
    this.checksum = checksum;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceSummaryView(item: PreferenceSummary): PreferenceSummaryView {
  return new PreferenceSummaryView(
    item.code,
    item.name,
    `${item.archived}`,
    item.ownerId,
    item.checksum,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceSummaryViews(items: PreferenceSummary[]): PreferenceSummaryView[] {
  const views: PreferenceSummaryView[] = [];
  for (const item of items) {
    views.push(toPreferenceSummaryView(item));
  }
  return views;
}

export function sumPreferenceSummaryView(view: PreferenceSummaryView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
