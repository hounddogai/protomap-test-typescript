import { SenderClaim } from "./sender-claim.js";

/** How screens and exports show a sender claim. */
export class SenderClaimView {
  codeText: string;
  title: string;
  attempts: string;
  phone: string;
  maximum: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    attempts: string,
    phone: string,
    maximum: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.attempts = attempts;
    this.phone = phone;
    this.maximum = maximum;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toSenderClaimView(item: SenderClaim): SenderClaimView {
  return new SenderClaimView(
    item.code,
    item.title,
    String(item.attempts),
    item.phone,
    item.maximum.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderClaimViews(items: SenderClaim[]): SenderClaimView[] {
  const views: SenderClaimView[] = [];
  for (const item of items) {
    views.push(toSenderClaimView(item));
  }
  return views;
}

export function sumSenderClaimView(view: SenderClaimView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedAttempts + parsedMaximum;
}
