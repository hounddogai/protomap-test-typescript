import * as text from "../../../../kit/text.js";
import { ManualConversionProfile } from "./manual-conversion-profile.js";

/** How screens and exports show a manual conversion profile. */
export class ManualConversionProfileView {
  code: string;
  name: string;
  startsAtText: string;
  reviewer: string;
  quantity: string;
  revisionText: string;
  batchSize: string;
  minimumText: string;
  category: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    startsAtText: string,
    reviewer: string,
    quantity: string,
    revisionText: string,
    batchSize: string,
    minimumText: string,
    category: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.startsAtText = startsAtText;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.revisionText = revisionText;
    this.batchSize = batchSize;
    this.minimumText = minimumText;
    this.category = category;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toManualConversionProfileView(item: ManualConversionProfile): ManualConversionProfileView {
  return new ManualConversionProfileView(
    item.code,
    text.truncate(item.name, 40),
    String(item.startsAt),
    text.truncate(item.reviewer, 64),
    String(item.quantity),
    String(item.revision),
    String(item.batchSize),
    item.minimum.toFixed(2),
    item.category,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualConversionProfileViews(items: ManualConversionProfile[]): ManualConversionProfileView[] {
  const views: ManualConversionProfileView[] = [];
  for (const item of items) {
    views.push(toManualConversionProfileView(item));
  }
  return views;
}

export function sumManualConversionProfileView(view: ManualConversionProfileView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedStartsAt + parsedQuantity + parsedRevision;
}
