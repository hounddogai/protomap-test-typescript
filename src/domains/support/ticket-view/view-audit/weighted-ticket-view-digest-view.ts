import * as text from "../../../../kit/text.js";
import { WeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

/** How screens and exports show a weighted ticket view digest. */
export class WeightedTicketViewDigestView {
  codeText: string;
  nameText: string;
  checksumText: string;
  quantity: string;
  clicksText: string;
  channel: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    checksumText: string,
    quantity: string,
    clicksText: string,
    channel: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.checksumText = checksumText;
    this.quantity = quantity;
    this.clicksText = clicksText;
    this.channel = channel;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTicketViewDigestView(item: WeightedTicketViewDigest): WeightedTicketViewDigestView {
  return new WeightedTicketViewDigestView(
    item.code,
    item.name,
    text.truncate(item.checksum, 64),
    String(item.quantity),
    String(item.clicks),
    item.channel,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTicketViewDigestViews(items: WeightedTicketViewDigest[]): WeightedTicketViewDigestView[] {
  const views: WeightedTicketViewDigestView[] = [];
  for (const item of items) {
    views.push(toWeightedTicketViewDigestView(item));
  }
  return views;
}

export function sumWeightedTicketViewDigestView(view: WeightedTicketViewDigestView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedQuantity + parsedClicks;
}
