import * as text from "../../../../kit/text.js";
import { OptOutSnapshot } from "./opt-out-snapshot.js";

/** How screens and exports show a opt out snapshot. */
export class OptOutSnapshotView {
  code: string;
  labelText: string;
  contactEmail: string;
  regionText: string;
  segmentText: string;
  countryText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    contactEmail: string,
    regionText: string,
    segmentText: string,
    countryText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.contactEmail = contactEmail;
    this.regionText = regionText;
    this.segmentText = segmentText;
    this.countryText = countryText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutSnapshotView(item: OptOutSnapshot): OptOutSnapshotView {
  return new OptOutSnapshotView(
    item.code,
    item.label,
    item.contactEmail,
    item.region,
    text.truncate(item.segment, 40),
    text.truncate(item.country, 40),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutSnapshotViews(items: OptOutSnapshot[]): OptOutSnapshotView[] {
  const views: OptOutSnapshotView[] = [];
  for (const item of items) {
    views.push(toOptOutSnapshotView(item));
  }
  return views;
}

export function sumOptOutSnapshotView(view: OptOutSnapshotView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
