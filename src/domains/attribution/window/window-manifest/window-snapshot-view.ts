import * as text from "../../../../kit/text.js";
import { WindowSnapshot } from "./window-snapshot.js";

/** How screens and exports show a window snapshot. */
export class WindowSnapshotView {
  codeText: string;
  nameText: string;
  contactEmail: string;
  conversionRate: string;
  costText: string;
  notes: string;
  limit: string;
  checksum: string;
  pinnedText: string;
  revision: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    contactEmail: string,
    conversionRate: string,
    costText: string,
    notes: string,
    limit: string,
    checksum: string,
    pinnedText: string,
    revision: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.costText = costText;
    this.notes = notes;
    this.limit = limit;
    this.checksum = checksum;
    this.pinnedText = pinnedText;
    this.revision = revision;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowSnapshotView(item: WindowSnapshot): WindowSnapshotView {
  return new WindowSnapshotView(
    item.code,
    text.truncate(item.name, 64),
    text.truncate(item.contactEmail, 40),
    item.conversionRate.toFixed(2),
    item.cost.toFixed(2),
    item.notes,
    String(item.limit),
    text.truncate(item.checksum, 120),
    `${item.pinned}`,
    String(item.revision),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowSnapshotViews(items: WindowSnapshot[]): WindowSnapshotView[] {
  const views: WindowSnapshotView[] = [];
  for (const item of items) {
    views.push(toWindowSnapshotView(item));
  }
  return views;
}

export function sumWindowSnapshotView(view: WindowSnapshotView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedConversionRate + parsedCost + parsedLimit;
}
