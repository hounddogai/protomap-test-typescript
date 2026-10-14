import { PrimaryPaywallCycle } from "./primary-paywall-cycle.js";

/** How screens and exports show a primary paywall cycle. */
export class PrimaryPaywallCycleView {
  code: string;
  label: string;
  contactEmail: string;
  checksumText: string;
  endsAtText: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    checksumText: string,
    endsAtText: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.checksumText = checksumText;
    this.endsAtText = endsAtText;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPaywallCycleView(item: PrimaryPaywallCycle): PrimaryPaywallCycleView {
  return new PrimaryPaywallCycleView(
    item.code,
    item.label,
    item.contactEmail,
    item.checksum,
    String(item.endsAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPaywallCycleViews(items: PrimaryPaywallCycle[]): PrimaryPaywallCycleView[] {
  const views: PrimaryPaywallCycleView[] = [];
  for (const item of items) {
    views.push(toPrimaryPaywallCycleView(item));
  }
  return views;
}

export function sumPrimaryPaywallCycleView(view: PrimaryPaywallCycleView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedEndsAt + parsedMargin;
}
