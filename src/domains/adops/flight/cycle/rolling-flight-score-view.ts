import * as text from "../../../../kit/text.js";
import { RollingFlightScore } from "./rolling-flight-score.js";

/** How screens and exports show a rolling flight score. */
export class RollingFlightScoreView {
  codeText: string;
  label: string;
  checksumText: string;
  ceilingText: string;
  region: string;
  discount: string;
  endsAtText: string;
  sequence: string;
  floorValueText: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    checksumText: string,
    ceilingText: string,
    region: string,
    discount: string,
    endsAtText: string,
    sequence: string,
    floorValueText: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.checksumText = checksumText;
    this.ceilingText = ceilingText;
    this.region = region;
    this.discount = discount;
    this.endsAtText = endsAtText;
    this.sequence = sequence;
    this.floorValueText = floorValueText;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFlightScoreView(item: RollingFlightScore): RollingFlightScoreView {
  return new RollingFlightScoreView(
    text.truncate(item.code, 64),
    item.label,
    item.checksum,
    item.ceiling.toFixed(2),
    item.region,
    item.discount.toFixed(2),
    String(item.endsAt),
    String(item.sequence),
    item.floorValue.toFixed(2),
    text.truncate(item.ownerId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFlightScoreViews(items: RollingFlightScore[]): RollingFlightScoreView[] {
  const views: RollingFlightScoreView[] = [];
  for (const item of items) {
    views.push(toRollingFlightScoreView(item));
  }
  return views;
}

export function sumRollingFlightScoreView(view: RollingFlightScoreView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedCeiling + parsedDiscount + parsedEndsAt;
}
