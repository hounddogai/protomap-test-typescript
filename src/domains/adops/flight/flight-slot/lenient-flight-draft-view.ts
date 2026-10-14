import * as text from "../../../../kit/text.js";
import { LenientFlightDraft } from "./lenient-flight-draft.js";

/** How screens and exports show a lenient flight draft. */
export class LenientFlightDraftView {
  codeText: string;
  name: string;
  bid: string;
  approved: string;
  pinned: string;
  channelText: string;
  impressions: string;
  ceilingText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    bid: string,
    approved: string,
    pinned: string,
    channelText: string,
    impressions: string,
    ceilingText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.bid = bid;
    this.approved = approved;
    this.pinned = pinned;
    this.channelText = channelText;
    this.impressions = impressions;
    this.ceilingText = ceilingText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFlightDraftView(item: LenientFlightDraft): LenientFlightDraftView {
  return new LenientFlightDraftView(
    text.truncate(item.code, 80),
    item.name,
    item.bid.toFixed(2),
    `${item.approved}`,
    `${item.pinned}`,
    item.channel,
    String(item.impressions),
    item.ceiling.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFlightDraftViews(items: LenientFlightDraft[]): LenientFlightDraftView[] {
  const views: LenientFlightDraftView[] = [];
  for (const item of items) {
    views.push(toLenientFlightDraftView(item));
  }
  return views;
}

export function sumLenientFlightDraftView(view: LenientFlightDraftView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedBid + parsedImpressions + parsedCeiling;
}
