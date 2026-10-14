import * as text from "../../../../kit/text.js";
import { LenientLevelProfile } from "./lenient-level-profile.js";

/** How screens and exports show a lenient level profile. */
export class LenientLevelProfileView {
  code: string;
  nameText: string;
  reviewer: string;
  segmentText: string;
  unit: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    reviewer: string,
    segmentText: string,
    unit: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.reviewer = reviewer;
    this.segmentText = segmentText;
    this.unit = unit;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toLenientLevelProfileView(item: LenientLevelProfile): LenientLevelProfileView {
  return new LenientLevelProfileView(
    item.code,
    item.name,
    text.truncate(item.reviewer, 80),
    item.segment,
    item.unit,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientLevelProfileViews(items: LenientLevelProfile[]): LenientLevelProfileView[] {
  const views: LenientLevelProfileView[] = [];
  for (const item of items) {
    views.push(toLenientLevelProfileView(item));
  }
  return views;
}

export function sumLenientLevelProfileView(view: LenientLevelProfileView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
