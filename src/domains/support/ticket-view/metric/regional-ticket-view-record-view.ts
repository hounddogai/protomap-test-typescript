import * as text from "../../../../kit/text.js";
import { RegionalTicketViewRecord } from "./regional-ticket-view-record.js";

/** How screens and exports show a regional ticket view record. */
export class RegionalTicketViewRecordView {
  code: string;
  nameText: string;
  sequence: string;
  impressionsText: string;
  channelText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    sequence: string,
    impressionsText: string,
    channelText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.sequence = sequence;
    this.impressionsText = impressionsText;
    this.channelText = channelText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalTicketViewRecordView(item: RegionalTicketViewRecord): RegionalTicketViewRecordView {
  return new RegionalTicketViewRecordView(
    item.code,
    text.truncate(item.name, 120),
    String(item.sequence),
    String(item.impressions),
    item.channel,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalTicketViewRecordViews(items: RegionalTicketViewRecord[]): RegionalTicketViewRecordView[] {
  const views: RegionalTicketViewRecordView[] = [];
  for (const item of items) {
    views.push(toRegionalTicketViewRecordView(item));
  }
  return views;
}

export function sumRegionalTicketViewRecordView(view: RegionalTicketViewRecordView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedSequence + parsedImpressions;
}
