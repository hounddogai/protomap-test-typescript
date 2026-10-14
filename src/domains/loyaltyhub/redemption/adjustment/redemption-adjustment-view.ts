import * as text from "../../../../kit/text.js";
import { RedemptionAdjustment } from "./redemption-adjustment.js";

/** How screens and exports show a redemption adjustment. */
export class RedemptionAdjustmentView {
  code: string;
  name: string;
  limit: string;
  ownerId: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    ownerId: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.ownerId = ownerId;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionAdjustmentView(item: RedemptionAdjustment): RedemptionAdjustmentView {
  return new RedemptionAdjustmentView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    String(item.limit),
    text.truncate(item.ownerId, 80),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionAdjustmentViews(items: RedemptionAdjustment[]): RedemptionAdjustmentView[] {
  const views: RedemptionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toRedemptionAdjustmentView(item));
  }
  return views;
}

export function sumRedemptionAdjustmentView(view: RedemptionAdjustmentView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedLimit + parsedStartsAt;
}
