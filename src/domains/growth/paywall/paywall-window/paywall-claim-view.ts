import { PaywallClaim } from "./paywall-claim.js";

/** How screens and exports show a paywall claim. */
export class PaywallClaimView {
  code: string;
  titleText: string;
  visible: string;
  audienceId: string;
  attempts: string;
  checksumText: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    visible: string,
    audienceId: string,
    attempts: string,
    checksumText: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.visible = visible;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.checksumText = checksumText;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallClaimView(item: PaywallClaim): PaywallClaimView {
  return new PaywallClaimView(
    item.code,
    item.title,
    `${item.visible}`,
    item.audienceId,
    String(item.attempts),
    item.checksum,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallClaimViews(items: PaywallClaim[]): PaywallClaimView[] {
  const views: PaywallClaimView[] = [];
  for (const item of items) {
    views.push(toPaywallClaimView(item));
  }
  return views;
}

export function sumPaywallClaimView(view: PaywallClaimView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedAttempts + parsedCapacity;
}
