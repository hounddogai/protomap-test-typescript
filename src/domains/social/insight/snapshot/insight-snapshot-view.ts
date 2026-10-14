import * as text from "../../../../kit/text.js";
import { InsightSnapshot } from "./insight-snapshot.js";

/** How screens and exports show a insight snapshot. */
export class InsightSnapshotView {
  codeText: string;
  name: string;
  audienceIdText: string;
  region: string;
  unit: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    audienceIdText: string,
    region: string,
    unit: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.audienceIdText = audienceIdText;
    this.region = region;
    this.unit = unit;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toInsightSnapshotView(item: InsightSnapshot): InsightSnapshotView {
  return new InsightSnapshotView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.audienceId, 40),
    item.region,
    text.truncate(item.unit, 64),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightSnapshotViews(items: InsightSnapshot[]): InsightSnapshotView[] {
  const views: InsightSnapshotView[] = [];
  for (const item of items) {
    views.push(toInsightSnapshotView(item));
  }
  return views;
}

export function sumInsightSnapshotView(view: InsightSnapshotView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
