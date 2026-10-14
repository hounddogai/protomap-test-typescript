import { PaywallRequest } from "./paywall-request.js";

/** How screens and exports show a paywall request. */
export class PaywallRequestView {
  code: string;
  title: string;
  reviewer: string;
  region: string;
  endsAt: string;
  contactEmail: string;
  campaignRef: string;
  locale: string;
  segment: string;
  retries: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    region: string,
    endsAt: string,
    contactEmail: string,
    campaignRef: string,
    locale: string,
    segment: string,
    retries: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.region = region;
    this.endsAt = endsAt;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.segment = segment;
    this.retries = retries;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallRequestView(item: PaywallRequest): PaywallRequestView {
  return new PaywallRequestView(
    item.code,
    item.title,
    item.reviewer,
    item.region,
    String(item.endsAt),
    item.contactEmail,
    item.campaignRef,
    item.locale,
    item.segment,
    String(item.retries),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallRequestViews(items: PaywallRequest[]): PaywallRequestView[] {
  const views: PaywallRequestView[] = [];
  for (const item of items) {
    views.push(toPaywallRequestView(item));
  }
  return views;
}

export function sumPaywallRequestView(view: PaywallRequestView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedEndsAt + parsedRetries + parsedVersion;
}
