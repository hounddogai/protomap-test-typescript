import * as text from "../../../../kit/text.js";
import { PendingStepDigest } from "./pending-step-digest.js";

/** How screens and exports show a pending step digest. */
export class PendingStepDigestView {
  codeText: string;
  name: string;
  visible: string;
  bidText: string;
  audienceId: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    visible: string,
    bidText: string,
    audienceId: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.visible = visible;
    this.bidText = bidText;
    this.audienceId = audienceId;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toPendingStepDigestView(item: PendingStepDigest): PendingStepDigestView {
  return new PendingStepDigestView(
    item.code,
    item.name,
    `${item.visible}`,
    item.bid.toFixed(2),
    text.truncate(item.audienceId, 80),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingStepDigestViews(items: PendingStepDigest[]): PendingStepDigestView[] {
  const views: PendingStepDigestView[] = [];
  for (const item of items) {
    views.push(toPendingStepDigestView(item));
  }
  return views;
}

export function sumPendingStepDigestView(view: PendingStepDigestView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedBid + parsedOpenRate;
}
