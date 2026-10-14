import * as text from "../../../../kit/text.js";
import { FallbackPlacementTier } from "./fallback-placement-tier.js";

/** How screens and exports show a fallback placement tier. */
export class FallbackPlacementTierView {
  code: string;
  nameText: string;
  maximum: string;
  sequence: string;
  pinnedText: string;
  startsAtText: string;
  visible: string;
  costText: string;
  utmSource: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    maximum: string,
    sequence: string,
    pinnedText: string,
    startsAtText: string,
    visible: string,
    costText: string,
    utmSource: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.maximum = maximum;
    this.sequence = sequence;
    this.pinnedText = pinnedText;
    this.startsAtText = startsAtText;
    this.visible = visible;
    this.costText = costText;
    this.utmSource = utmSource;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPlacementTierView(item: FallbackPlacementTier): FallbackPlacementTierView {
  return new FallbackPlacementTierView(
    item.code,
    text.truncate(item.name, 40),
    item.maximum.toFixed(2),
    String(item.sequence),
    `${item.pinned}`,
    String(item.startsAt),
    `${item.visible}`,
    item.cost.toFixed(2),
    text.truncate(item.utmSource, 120),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPlacementTierViews(items: FallbackPlacementTier[]): FallbackPlacementTierView[] {
  const views: FallbackPlacementTierView[] = [];
  for (const item of items) {
    views.push(toFallbackPlacementTierView(item));
  }
  return views;
}

export function sumFallbackPlacementTierView(view: FallbackPlacementTierView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedMaximum + parsedSequence + parsedStartsAt;
}
