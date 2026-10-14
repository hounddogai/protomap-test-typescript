import * as text from "../../../../kit/text.js";
import { PlacementCycle } from "./placement-cycle.js";

/** How screens and exports show a placement cycle. */
export class PlacementCycleView {
  codeText: string;
  name: string;
  floorValueText: string;
  campaignRef: string;
  utmSource: string;
  endsAtText: string;
  bid: string;
  revisionText: string;
  rate: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    floorValueText: string,
    campaignRef: string,
    utmSource: string,
    endsAtText: string,
    bid: string,
    revisionText: string,
    rate: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.floorValueText = floorValueText;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
    this.endsAtText = endsAtText;
    this.bid = bid;
    this.revisionText = revisionText;
    this.rate = rate;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementCycleView(item: PlacementCycle): PlacementCycleView {
  return new PlacementCycleView(
    item.code,
    item.name,
    item.floorValue.toFixed(2),
    item.campaignRef,
    text.truncate(item.utmSource, 120),
    String(item.endsAt),
    item.bid.toFixed(2),
    String(item.revision),
    item.rate.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementCycleViews(items: PlacementCycle[]): PlacementCycleView[] {
  const views: PlacementCycleView[] = [];
  for (const item of items) {
    views.push(toPlacementCycleView(item));
  }
  return views;
}

export function sumPlacementCycleView(view: PlacementCycleView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedFloorValue + parsedEndsAt + parsedBid;
}
