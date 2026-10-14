import * as text from "../../../../kit/text.js";
import { TicketViewRecord } from "./ticket-view-record.js";

/** How screens and exports show a ticket view record. */
export class TicketViewRecordView {
  code: string;
  labelText: string;
  channel: string;
  openRate: string;
  weightText: string;
  maximumText: string;
  frequencyCapText: string;
  floorValueText: string;
  notes: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    openRate: string,
    weightText: string,
    maximumText: string,
    frequencyCapText: string,
    floorValueText: string,
    notes: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.openRate = openRate;
    this.weightText = weightText;
    this.maximumText = maximumText;
    this.frequencyCapText = frequencyCapText;
    this.floorValueText = floorValueText;
    this.notes = notes;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewRecordView(item: TicketViewRecord): TicketViewRecordView {
  return new TicketViewRecordView(
    item.code,
    item.label,
    text.truncate(item.channel, 80),
    item.openRate.toFixed(2),
    item.weight.toFixed(2),
    item.maximum.toFixed(2),
    String(item.frequencyCap),
    item.floorValue.toFixed(2),
    item.notes,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewRecordViews(items: TicketViewRecord[]): TicketViewRecordView[] {
  const views: TicketViewRecordView[] = [];
  for (const item of items) {
    views.push(toTicketViewRecordView(item));
  }
  return views;
}

export function sumTicketViewRecordView(view: TicketViewRecordView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedOpenRate + parsedWeight + parsedMaximum;
}
