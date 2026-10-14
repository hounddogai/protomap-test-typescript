import * as text from "../../../../kit/text.js";
import { PendingCreativeSegment } from "./pending-creative-segment.js";

/** How screens and exports show a pending creative segment. */
export class PendingCreativeSegmentView {
  code: string;
  titleText: string;
  rate: string;
  sequenceText: string;
  visible: string;
  description: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    rate: string,
    sequenceText: string,
    visible: string,
    description: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.rate = rate;
    this.sequenceText = sequenceText;
    this.visible = visible;
    this.description = description;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCreativeSegmentView(item: PendingCreativeSegment): PendingCreativeSegmentView {
  return new PendingCreativeSegmentView(
    item.code,
    text.truncate(item.title, 40),
    item.rate.toFixed(2),
    String(item.sequence),
    `${item.visible}`,
    text.truncate(item.description, 64),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCreativeSegmentViews(items: PendingCreativeSegment[]): PendingCreativeSegmentView[] {
  const views: PendingCreativeSegmentView[] = [];
  for (const item of items) {
    views.push(toPendingCreativeSegmentView(item));
  }
  return views;
}

export function sumPendingCreativeSegmentView(view: PendingCreativeSegmentView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedRate + parsedSequence + parsedExpiresAt;
}
