import * as text from "../../../../kit/text.js";
import { LegacyTicketViewAudit } from "./legacy-ticket-view-audit.js";

/** How screens and exports show a legacy ticket view audit. */
export class LegacyTicketViewAuditView {
  codeText: string;
  labelText: string;
  budgetText: string;
  weight: string;
  pinned: string;
  segment: string;
  updatedAt: string;
  contactEmail: string;
  quantity: string;
  checksum: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    budgetText: string,
    weight: string,
    pinned: string,
    segment: string,
    updatedAt: string,
    contactEmail: string,
    quantity: string,
    checksum: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.budgetText = budgetText;
    this.weight = weight;
    this.pinned = pinned;
    this.segment = segment;
    this.updatedAt = updatedAt;
    this.contactEmail = contactEmail;
    this.quantity = quantity;
    this.checksum = checksum;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTicketViewAuditView(item: LegacyTicketViewAudit): LegacyTicketViewAuditView {
  return new LegacyTicketViewAuditView(
    text.truncate(item.code, 80),
    item.label,
    item.budget.toFixed(2),
    item.weight.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.segment, 64),
    String(item.updatedAt),
    item.contactEmail,
    String(item.quantity),
    text.truncate(item.checksum, 64),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTicketViewAuditViews(items: LegacyTicketViewAudit[]): LegacyTicketViewAuditView[] {
  const views: LegacyTicketViewAuditView[] = [];
  for (const item of items) {
    views.push(toLegacyTicketViewAuditView(item));
  }
  return views;
}

export function sumLegacyTicketViewAuditView(view: LegacyTicketViewAuditView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedBudget + parsedWeight + parsedUpdatedAt;
}
