import * as text from "../../../../kit/text.js";
import { LegacyWindowSummary } from "./legacy-window-summary.js";

/** How screens and exports show a legacy window summary. */
export class LegacyWindowSummaryView {
  code: string;
  title: string;
  contactEmail: string;
  archived: string;
  variant: string;
  bid: string;
  ceiling: string;
  channelText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    archived: string,
    variant: string,
    bid: string,
    ceiling: string,
    channelText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.archived = archived;
    this.variant = variant;
    this.bid = bid;
    this.ceiling = ceiling;
    this.channelText = channelText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWindowSummaryView(item: LegacyWindowSummary): LegacyWindowSummaryView {
  return new LegacyWindowSummaryView(
    item.code,
    item.title,
    text.truncate(item.contactEmail, 40),
    `${item.archived}`,
    item.variant,
    item.bid.toFixed(2),
    item.ceiling.toFixed(2),
    item.channel,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWindowSummaryViews(items: LegacyWindowSummary[]): LegacyWindowSummaryView[] {
  const views: LegacyWindowSummaryView[] = [];
  for (const item of items) {
    views.push(toLegacyWindowSummaryView(item));
  }
  return views;
}

export function sumLegacyWindowSummaryView(view: LegacyWindowSummaryView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedBid + parsedCeiling;
}
