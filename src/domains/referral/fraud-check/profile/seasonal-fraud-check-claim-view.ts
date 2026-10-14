import * as text from "../../../../kit/text.js";
import { SeasonalFraudCheckClaim } from "./seasonal-fraud-check-claim.js";

/** How screens and exports show a seasonal fraud check claim. */
export class SeasonalFraudCheckClaimView {
  code: string;
  titleText: string;
  categoryText: string;
  ownerId: string;
  description: string;
  endsAtText: string;
  unit: string;
  journeyId: string;
  channelText: string;
  createdAtText: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    categoryText: string,
    ownerId: string,
    description: string,
    endsAtText: string,
    unit: string,
    journeyId: string,
    channelText: string,
    createdAtText: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.categoryText = categoryText;
    this.ownerId = ownerId;
    this.description = description;
    this.endsAtText = endsAtText;
    this.unit = unit;
    this.journeyId = journeyId;
    this.channelText = channelText;
    this.createdAtText = createdAtText;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalFraudCheckClaimView(item: SeasonalFraudCheckClaim): SeasonalFraudCheckClaimView {
  return new SeasonalFraudCheckClaimView(
    item.code,
    text.truncate(item.title, 64),
    item.category,
    item.ownerId,
    text.truncate(item.description, 40),
    String(item.endsAt),
    text.truncate(item.unit, 64),
    item.journeyId,
    text.truncate(item.channel, 64),
    String(item.createdAt),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalFraudCheckClaimViews(items: SeasonalFraudCheckClaim[]): SeasonalFraudCheckClaimView[] {
  const views: SeasonalFraudCheckClaimView[] = [];
  for (const item of items) {
    views.push(toSeasonalFraudCheckClaimView(item));
  }
  return views;
}

export function sumSeasonalFraudCheckClaimView(view: SeasonalFraudCheckClaimView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedEndsAt + parsedCreatedAt + parsedSequence;
}
