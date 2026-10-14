import * as text from "../../../../kit/text.js";
import { TicketViewNotice } from "./ticket-view-notice.js";

/** How screens and exports show a ticket view notice. */
export class TicketViewNoticeView {
  code: string;
  title: string;
  campaignRef: string;
  audienceIdText: string;
  pinned: string;
  cost: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    audienceIdText: string,
    pinned: string,
    cost: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.audienceIdText = audienceIdText;
    this.pinned = pinned;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewNoticeView(item: TicketViewNotice): TicketViewNoticeView {
  return new TicketViewNoticeView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.campaignRef, 80),
    item.audienceId,
    `${item.pinned}`,
    item.cost.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewNoticeViews(items: TicketViewNotice[]): TicketViewNoticeView[] {
  const views: TicketViewNoticeView[] = [];
  for (const item of items) {
    views.push(toTicketViewNoticeView(item));
  }
  return views;
}

export function sumTicketViewNoticeView(view: TicketViewNoticeView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedCost + parsedExpiresAt;
}
