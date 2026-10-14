import * as text from "../../../../kit/text.js";
import { EscalationEntry } from "./escalation-entry.js";

/** How screens and exports show a escalation entry. */
export class EscalationEntryView {
  code: string;
  name: string;
  title: string;
  sendAt: string;
  archivedText: string;
  countryText: string;
  channel: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    title: string,
    sendAt: string,
    archivedText: string,
    countryText: string,
    channel: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.sendAt = sendAt;
    this.archivedText = archivedText;
    this.countryText = countryText;
    this.channel = channel;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationEntryView(item: EscalationEntry): EscalationEntryView {
  return new EscalationEntryView(
    text.truncate(item.code, 64),
    item.name,
    item.title,
    String(item.sendAt),
    `${item.archived}`,
    text.truncate(item.country, 80),
    text.truncate(item.channel, 64),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationEntryViews(items: EscalationEntry[]): EscalationEntryView[] {
  const views: EscalationEntryView[] = [];
  for (const item of items) {
    views.push(toEscalationEntryView(item));
  }
  return views;
}

export function sumEscalationEntryView(view: EscalationEntryView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
