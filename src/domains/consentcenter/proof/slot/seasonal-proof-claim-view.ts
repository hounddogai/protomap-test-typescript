import * as text from "../../../../kit/text.js";
import { SeasonalProofClaim } from "./seasonal-proof-claim.js";

/** How screens and exports show a seasonal proof claim. */
export class SeasonalProofClaimView {
  code: string;
  titleText: string;
  weight: string;
  ceiling: string;
  batchSize: string;
  startsAt: string;
  endsAt: string;
  ownerIdText: string;
  activeText: string;
  maximum: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    weight: string,
    ceiling: string,
    batchSize: string,
    startsAt: string,
    endsAt: string,
    ownerIdText: string,
    activeText: string,
    maximum: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.weight = weight;
    this.ceiling = ceiling;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
    this.endsAt = endsAt;
    this.ownerIdText = ownerIdText;
    this.activeText = activeText;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalProofClaimView(item: SeasonalProofClaim): SeasonalProofClaimView {
  return new SeasonalProofClaimView(
    text.truncate(item.code, 80),
    item.title,
    item.weight.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.batchSize),
    String(item.startsAt),
    String(item.endsAt),
    text.truncate(item.ownerId, 120),
    `${item.active}`,
    item.maximum.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalProofClaimViews(items: SeasonalProofClaim[]): SeasonalProofClaimView[] {
  const views: SeasonalProofClaimView[] = [];
  for (const item of items) {
    views.push(toSeasonalProofClaimView(item));
  }
  return views;
}

export function sumSeasonalProofClaimView(view: SeasonalProofClaimView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedWeight + parsedCeiling + parsedBatchSize;
}
