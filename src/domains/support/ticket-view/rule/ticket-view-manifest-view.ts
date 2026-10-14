import * as text from "../../../../kit/text.js";
import { TicketViewManifest } from "./ticket-view-manifest.js";

/** How screens and exports show a ticket view manifest. */
export class TicketViewManifestView {
  code: string;
  labelText: string;
  weight: string;
  phoneText: string;
  sendAt: string;
  rateText: string;
  frequencyCap: string;
  source: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    weight: string,
    phoneText: string,
    sendAt: string,
    rateText: string,
    frequencyCap: string,
    source: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.weight = weight;
    this.phoneText = phoneText;
    this.sendAt = sendAt;
    this.rateText = rateText;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewManifestView(item: TicketViewManifest): TicketViewManifestView {
  return new TicketViewManifestView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    text.truncate(item.phone, 40),
    String(item.sendAt),
    item.rate.toFixed(2),
    String(item.frequencyCap),
    text.truncate(item.source, 120),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewManifestViews(items: TicketViewManifest[]): TicketViewManifestView[] {
  const views: TicketViewManifestView[] = [];
  for (const item of items) {
    views.push(toTicketViewManifestView(item));
  }
  return views;
}

export function sumTicketViewManifestView(view: TicketViewManifestView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedWeight + parsedSendAt + parsedRate;
}
