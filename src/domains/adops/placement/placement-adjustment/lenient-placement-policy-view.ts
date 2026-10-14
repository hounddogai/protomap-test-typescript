import * as text from "../../../../kit/text.js";
import { LenientPlacementPolicy } from "./lenient-placement-policy.js";

/** How screens and exports show a lenient placement policy. */
export class LenientPlacementPolicyView {
  codeText: string;
  name: string;
  rate: string;
  sourceText: string;
  externalRef: string;
  channel: string;
  bid: string;
  minimumText: string;
  description: string;
  ceiling: string;
  region: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    rate: string,
    sourceText: string,
    externalRef: string,
    channel: string,
    bid: string,
    minimumText: string,
    description: string,
    ceiling: string,
    region: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.rate = rate;
    this.sourceText = sourceText;
    this.externalRef = externalRef;
    this.channel = channel;
    this.bid = bid;
    this.minimumText = minimumText;
    this.description = description;
    this.ceiling = ceiling;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPlacementPolicyView(item: LenientPlacementPolicy): LenientPlacementPolicyView {
  return new LenientPlacementPolicyView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    text.truncate(item.source, 64),
    item.externalRef,
    text.truncate(item.channel, 64),
    item.bid.toFixed(2),
    item.minimum.toFixed(2),
    item.description,
    item.ceiling.toFixed(2),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPlacementPolicyViews(items: LenientPlacementPolicy[]): LenientPlacementPolicyView[] {
  const views: LenientPlacementPolicyView[] = [];
  for (const item of items) {
    views.push(toLenientPlacementPolicyView(item));
  }
  return views;
}

export function sumLenientPlacementPolicyView(view: LenientPlacementPolicyView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedRate + parsedBid + parsedMinimum;
}
