import * as text from "../../../../kit/text.js";
import { ManualTicketViewClaim } from "./manual-ticket-view-claim.js";

/** How screens and exports show a manual ticket view claim. */
export class ManualTicketViewClaimView {
  code: string;
  title: string;
  endsAt: string;
  windowDays: string;
  sequence: string;
  rate: string;
  maximumText: string;
  graceDays: string;
  name: string;
  contactEmail: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAt: string,
    windowDays: string,
    sequence: string,
    rate: string,
    maximumText: string,
    graceDays: string,
    name: string,
    contactEmail: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.windowDays = windowDays;
    this.sequence = sequence;
    this.rate = rate;
    this.maximumText = maximumText;
    this.graceDays = graceDays;
    this.name = name;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toManualTicketViewClaimView(item: ManualTicketViewClaim): ManualTicketViewClaimView {
  return new ManualTicketViewClaimView(
    item.code,
    text.truncate(item.title, 80),
    String(item.endsAt),
    String(item.windowDays),
    String(item.sequence),
    item.rate.toFixed(2),
    item.maximum.toFixed(2),
    String(item.graceDays),
    item.name,
    item.contactEmail,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTicketViewClaimViews(items: ManualTicketViewClaim[]): ManualTicketViewClaimView[] {
  const views: ManualTicketViewClaimView[] = [];
  for (const item of items) {
    views.push(toManualTicketViewClaimView(item));
  }
  return views;
}

export function sumManualTicketViewClaimView(view: ManualTicketViewClaimView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedEndsAt + parsedWindowDays + parsedSequence;
}
