import * as text from "../../../../kit/text.js";
import { GlobalSenderEntry } from "./global-sender-entry.js";

/** How screens and exports show a global sender entry. */
export class GlobalSenderEntryView {
  code: string;
  label: string;
  startsAt: string;
  budget: string;
  sendAt: string;
  expiresAtText: string;
  graceDaysText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    startsAt: string,
    budget: string,
    sendAt: string,
    expiresAtText: string,
    graceDaysText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.budget = budget;
    this.sendAt = sendAt;
    this.expiresAtText = expiresAtText;
    this.graceDaysText = graceDaysText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSenderEntryView(item: GlobalSenderEntry): GlobalSenderEntryView {
  return new GlobalSenderEntryView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 120),
    String(item.startsAt),
    item.budget.toFixed(2),
    String(item.sendAt),
    String(item.expiresAt),
    String(item.graceDays),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSenderEntryViews(items: GlobalSenderEntry[]): GlobalSenderEntryView[] {
  const views: GlobalSenderEntryView[] = [];
  for (const item of items) {
    views.push(toGlobalSenderEntryView(item));
  }
  return views;
}

export function sumGlobalSenderEntryView(view: GlobalSenderEntryView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedStartsAt + parsedBudget + parsedSendAt;
}
