import * as text from "../../../../kit/text.js";
import { LenientTicketViewTemplate } from "./lenient-ticket-view-template.js";

/** How screens and exports show a lenient ticket view template. */
export class LenientTicketViewTemplateView {
  codeText: string;
  titleText: string;
  expiresAtText: string;
  reviewer: string;
  phone: string;
  currencyText: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    expiresAtText: string,
    reviewer: string,
    phone: string,
    currencyText: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.expiresAtText = expiresAtText;
    this.reviewer = reviewer;
    this.phone = phone;
    this.currencyText = currencyText;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientTicketViewTemplateView(item: LenientTicketViewTemplate): LenientTicketViewTemplateView {
  return new LenientTicketViewTemplateView(
    text.truncate(item.code, 80),
    item.title,
    String(item.expiresAt),
    text.truncate(item.reviewer, 80),
    text.truncate(item.phone, 40),
    item.currency,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientTicketViewTemplateViews(items: LenientTicketViewTemplate[]): LenientTicketViewTemplateView[] {
  const views: LenientTicketViewTemplateView[] = [];
  for (const item of items) {
    views.push(toLenientTicketViewTemplateView(item));
  }
  return views;
}

export function sumLenientTicketViewTemplateView(view: LenientTicketViewTemplateView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedExpiresAt + parsedSendAt;
}
