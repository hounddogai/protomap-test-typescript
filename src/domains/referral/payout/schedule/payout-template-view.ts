import { PayoutTemplate } from "./payout-template.js";

/** How screens and exports show a payout template. */
export class PayoutTemplateView {
  codeText: string;
  labelText: string;
  ownerIdText: string;
  revisionText: string;
  expiresAt: string;
  openRateText: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    ownerIdText: string,
    revisionText: string,
    expiresAt: string,
    openRateText: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.ownerIdText = ownerIdText;
    this.revisionText = revisionText;
    this.expiresAt = expiresAt;
    this.openRateText = openRateText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutTemplateView(item: PayoutTemplate): PayoutTemplateView {
  return new PayoutTemplateView(
    item.code,
    item.label,
    item.ownerId,
    String(item.revision),
    String(item.expiresAt),
    item.openRate.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutTemplateViews(items: PayoutTemplate[]): PayoutTemplateView[] {
  const views: PayoutTemplateView[] = [];
  for (const item of items) {
    views.push(toPayoutTemplateView(item));
  }
  return views;
}

export function sumPayoutTemplateView(view: PayoutTemplateView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedRevision + parsedExpiresAt + parsedOpenRate;
}
