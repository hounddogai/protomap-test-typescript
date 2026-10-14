import * as text from "../../../../kit/text.js";
import { LegacyTicketViewDraft } from "./legacy-ticket-view-draft.js";

/** How screens and exports show a legacy ticket view draft. */
export class LegacyTicketViewDraftView {
  code: string;
  title: string;
  phoneText: string;
  sourceText: string;
  labelText: string;
  expiresAt: string;
  sendAt: string;
  description: string;
  externalRefText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    phoneText: string,
    sourceText: string,
    labelText: string,
    expiresAt: string,
    sendAt: string,
    description: string,
    externalRefText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.phoneText = phoneText;
    this.sourceText = sourceText;
    this.labelText = labelText;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.description = description;
    this.externalRefText = externalRefText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTicketViewDraftView(item: LegacyTicketViewDraft): LegacyTicketViewDraftView {
  return new LegacyTicketViewDraftView(
    text.truncate(item.code, 80),
    item.title,
    item.phone,
    item.source,
    text.truncate(item.label, 64),
    String(item.expiresAt),
    String(item.sendAt),
    item.description,
    text.truncate(item.externalRef, 120),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTicketViewDraftViews(items: LegacyTicketViewDraft[]): LegacyTicketViewDraftView[] {
  const views: LegacyTicketViewDraftView[] = [];
  for (const item of items) {
    views.push(toLegacyTicketViewDraftView(item));
  }
  return views;
}

export function sumLegacyTicketViewDraftView(view: LegacyTicketViewDraftView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedExpiresAt + parsedSendAt;
}
