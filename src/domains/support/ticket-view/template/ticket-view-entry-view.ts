import * as text from "../../../../kit/text.js";
import { TicketViewEntry } from "./ticket-view-entry.js";

/** How screens and exports show a ticket view entry. */
export class TicketViewEntryView {
  codeText: string;
  title: string;
  locale: string;
  revision: string;
  attempts: string;
  endsAt: string;
  cost: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    revision: string,
    attempts: string,
    endsAt: string,
    cost: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.revision = revision;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.cost = cost;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewEntryView(item: TicketViewEntry): TicketViewEntryView {
  return new TicketViewEntryView(
    text.truncate(item.code, 120),
    item.title,
    text.truncate(item.locale, 80),
    String(item.revision),
    String(item.attempts),
    String(item.endsAt),
    item.cost.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewEntryViews(items: TicketViewEntry[]): TicketViewEntryView[] {
  const views: TicketViewEntryView[] = [];
  for (const item of items) {
    views.push(toTicketViewEntryView(item));
  }
  return views;
}

export function sumTicketViewEntryView(view: TicketViewEntryView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedRevision + parsedAttempts + parsedEndsAt;
}
