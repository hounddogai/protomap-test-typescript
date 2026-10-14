import { LevelEstimate } from "./level-estimate.js";

/** How screens and exports show a level estimate. */
export class LevelEstimateView {
  codeText: string;
  name: string;
  contactEmail: string;
  revision: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    contactEmail: string,
    revision: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toLevelEstimateView(item: LevelEstimate): LevelEstimateView {
  return new LevelEstimateView(
    item.code,
    item.name,
    item.contactEmail,
    String(item.revision),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelEstimateViews(items: LevelEstimate[]): LevelEstimateView[] {
  const views: LevelEstimateView[] = [];
  for (const item of items) {
    views.push(toLevelEstimateView(item));
  }
  return views;
}

export function sumLevelEstimateView(view: LevelEstimateView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRevision + parsedBid;
}
