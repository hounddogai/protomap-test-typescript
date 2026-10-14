import * as text from "../../../../kit/text.js";
import { WeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

/** How screens and exports show a weighted ticket view cycle. */
export class WeightedTicketViewCycleView {
  code: string;
  label: string;
  country: string;
  channel: string;
  checksumText: string;
  approvedText: string;
  maximumText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    country: string,
    channel: string,
    checksumText: string,
    approvedText: string,
    maximumText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.channel = channel;
    this.checksumText = checksumText;
    this.approvedText = approvedText;
    this.maximumText = maximumText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTicketViewCycleView(item: WeightedTicketViewCycle): WeightedTicketViewCycleView {
  return new WeightedTicketViewCycleView(
    item.code,
    text.truncate(item.label, 64),
    item.country,
    item.channel,
    item.checksum,
    `${item.approved}`,
    item.maximum.toFixed(2),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTicketViewCycleViews(items: WeightedTicketViewCycle[]): WeightedTicketViewCycleView[] {
  const views: WeightedTicketViewCycleView[] = [];
  for (const item of items) {
    views.push(toWeightedTicketViewCycleView(item));
  }
  return views;
}

export function sumWeightedTicketViewCycleView(view: WeightedTicketViewCycleView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedMaximum;
}
