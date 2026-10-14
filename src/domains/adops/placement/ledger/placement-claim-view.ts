import * as text from "../../../../kit/text.js";
import { PlacementClaim } from "./placement-claim.js";

/** How screens and exports show a placement claim. */
export class PlacementClaimView {
  codeText: string;
  titleText: string;
  sequence: string;
  summaryText: string;
  checksumText: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    sequence: string,
    summaryText: string,
    checksumText: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.sequence = sequence;
    this.summaryText = summaryText;
    this.checksumText = checksumText;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementClaimView(item: PlacementClaim): PlacementClaimView {
  return new PlacementClaimView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 40),
    String(item.sequence),
    item.summary,
    text.truncate(item.checksum, 40),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementClaimViews(items: PlacementClaim[]): PlacementClaimView[] {
  const views: PlacementClaimView[] = [];
  for (const item of items) {
    views.push(toPlacementClaimView(item));
  }
  return views;
}

export function sumPlacementClaimView(view: PlacementClaimView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedSequence + parsedExpiresAt;
}
