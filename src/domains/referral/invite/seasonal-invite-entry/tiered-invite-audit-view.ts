import { TieredInviteAudit } from "./tiered-invite-audit.js";

/** How screens and exports show a tiered invite audit. */
export class TieredInviteAuditView {
  codeText: string;
  title: string;
  discount: string;
  updatedAt: string;
  sendAtText: string;
  label: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    discount: string,
    updatedAt: string,
    sendAtText: string,
    label: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.sendAtText = sendAtText;
    this.label = label;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toTieredInviteAuditView(item: TieredInviteAudit): TieredInviteAuditView {
  return new TieredInviteAuditView(
    item.code,
    item.title,
    item.discount.toFixed(2),
    String(item.updatedAt),
    String(item.sendAt),
    item.label,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredInviteAuditViews(items: TieredInviteAudit[]): TieredInviteAuditView[] {
  const views: TieredInviteAuditView[] = [];
  for (const item of items) {
    views.push(toTieredInviteAuditView(item));
  }
  return views;
}

export function sumTieredInviteAuditView(view: TieredInviteAuditView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedDiscount + parsedUpdatedAt + parsedSendAt;
}
