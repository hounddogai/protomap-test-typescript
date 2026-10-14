import * as text from "../../../../kit/text.js";
import { CreativePreference } from "./creative-preference.js";

/** How screens and exports show a creative preference. */
export class CreativePreferenceView {
  code: string;
  label: string;
  name: string;
  openRateText: string;
  source: string;
  bid: string;
  revision: string;
  active: string;
  channel: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    name: string,
    openRateText: string,
    source: string,
    bid: string,
    revision: string,
    active: string,
    channel: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.openRateText = openRateText;
    this.source = source;
    this.bid = bid;
    this.revision = revision;
    this.active = active;
    this.channel = channel;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toCreativePreferenceView(item: CreativePreference): CreativePreferenceView {
  return new CreativePreferenceView(
    item.code,
    text.truncate(item.label, 120),
    item.name,
    item.openRate.toFixed(2),
    text.truncate(item.source, 64),
    item.bid.toFixed(2),
    String(item.revision),
    `${item.active}`,
    item.channel,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativePreferenceViews(items: CreativePreference[]): CreativePreferenceView[] {
  const views: CreativePreferenceView[] = [];
  for (const item of items) {
    views.push(toCreativePreferenceView(item));
  }
  return views;
}

export function sumCreativePreferenceView(view: CreativePreferenceView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedOpenRate + parsedBid + parsedRevision;
}
