import * as text from "../../../../kit/text.js";
import { ReputationScore } from "./reputation-score.js";

/** How screens and exports show a reputation score. */
export class ReputationScoreView {
  code: string;
  labelText: string;
  audienceIdText: string;
  regionText: string;
  discount: string;
  limit: string;
  variant: string;
  createdAt: string;
  floorValue: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    audienceIdText: string,
    regionText: string,
    discount: string,
    limit: string,
    variant: string,
    createdAt: string,
    floorValue: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.audienceIdText = audienceIdText;
    this.regionText = regionText;
    this.discount = discount;
    this.limit = limit;
    this.variant = variant;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toReputationScoreView(item: ReputationScore): ReputationScoreView {
  return new ReputationScoreView(
    item.code,
    item.label,
    item.audienceId,
    text.truncate(item.region, 40),
    item.discount.toFixed(2),
    String(item.limit),
    text.truncate(item.variant, 64),
    String(item.createdAt),
    item.floorValue.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationScoreViews(items: ReputationScore[]): ReputationScoreView[] {
  const views: ReputationScoreView[] = [];
  for (const item of items) {
    views.push(toReputationScoreView(item));
  }
  return views;
}

export function sumReputationScoreView(view: ReputationScoreView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedDiscount + parsedLimit + parsedCreatedAt;
}
