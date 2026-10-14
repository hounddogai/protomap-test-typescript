import * as text from "../../../../kit/text.js";
import { NudgeCheckpoint } from "./nudge-checkpoint.js";

/** How screens and exports show a nudge checkpoint. */
export class NudgeCheckpointView {
  codeText: string;
  name: string;
  visibleText: string;
  country: string;
  bid: string;
  revision: string;
  activeText: string;
  clicks: string;
  expiresAt: string;
  conversionRate: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    visibleText: string,
    country: string,
    bid: string,
    revision: string,
    activeText: string,
    clicks: string,
    expiresAt: string,
    conversionRate: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.visibleText = visibleText;
    this.country = country;
    this.bid = bid;
    this.revision = revision;
    this.activeText = activeText;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.conversionRate = conversionRate;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeCheckpointView(item: NudgeCheckpoint): NudgeCheckpointView {
  return new NudgeCheckpointView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 120),
    `${item.visible}`,
    item.country,
    item.bid.toFixed(2),
    String(item.revision),
    `${item.active}`,
    String(item.clicks),
    String(item.expiresAt),
    item.conversionRate.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeCheckpointViews(items: NudgeCheckpoint[]): NudgeCheckpointView[] {
  const views: NudgeCheckpointView[] = [];
  for (const item of items) {
    views.push(toNudgeCheckpointView(item));
  }
  return views;
}

export function sumNudgeCheckpointView(view: NudgeCheckpointView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBid + parsedRevision + parsedClicks;
}
