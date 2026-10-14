import { PaywallSlot } from "./paywall-slot.js";

/** How screens and exports show a paywall slot. */
export class PaywallSlotView {
  code: string;
  titleText: string;
  channel: string;
  expiresAt: string;
  revision: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    channel: string,
    expiresAt: string,
    revision: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.revision = revision;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallSlotView(item: PaywallSlot): PaywallSlotView {
  return new PaywallSlotView(
    item.code,
    item.title,
    item.channel,
    String(item.expiresAt),
    String(item.revision),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallSlotViews(items: PaywallSlot[]): PaywallSlotView[] {
  const views: PaywallSlotView[] = [];
  for (const item of items) {
    views.push(toPaywallSlotView(item));
  }
  return views;
}

export function sumPaywallSlotView(view: PaywallSlotView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedExpiresAt + parsedRevision;
}
