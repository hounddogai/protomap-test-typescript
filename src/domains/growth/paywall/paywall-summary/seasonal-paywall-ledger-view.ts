import { SeasonalPaywallLedger } from "./seasonal-paywall-ledger.js";

/** How screens and exports show a seasonal paywall ledger. */
export class SeasonalPaywallLedgerView {
  code: string;
  titleText: string;
  summaryText: string;
  updatedAt: string;
  retries: string;
  country: string;
  revision: string;
  labelText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    summaryText: string,
    updatedAt: string,
    retries: string,
    country: string,
    revision: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.summaryText = summaryText;
    this.updatedAt = updatedAt;
    this.retries = retries;
    this.country = country;
    this.revision = revision;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPaywallLedgerView(item: SeasonalPaywallLedger): SeasonalPaywallLedgerView {
  return new SeasonalPaywallLedgerView(
    item.code,
    item.title,
    item.summary,
    String(item.updatedAt),
    String(item.retries),
    item.country,
    String(item.revision),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPaywallLedgerViews(items: SeasonalPaywallLedger[]): SeasonalPaywallLedgerView[] {
  const views: SeasonalPaywallLedgerView[] = [];
  for (const item of items) {
    views.push(toSeasonalPaywallLedgerView(item));
  }
  return views;
}

export function sumSeasonalPaywallLedgerView(view: SeasonalPaywallLedgerView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedUpdatedAt + parsedRetries + parsedRevision;
}
