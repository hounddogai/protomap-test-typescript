import { DomainManifest } from "./domain-manifest.js";

/** How screens and exports show a domain manifest. */
export class DomainManifestView {
  code: string;
  name: string;
  graceDaysText: string;
  reviewer: string;
  budgetText: string;
  maximumText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDaysText: string,
    reviewer: string,
    budgetText: string,
    maximumText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDaysText = graceDaysText;
    this.reviewer = reviewer;
    this.budgetText = budgetText;
    this.maximumText = maximumText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toDomainManifestView(item: DomainManifest): DomainManifestView {
  return new DomainManifestView(
    item.code,
    item.name,
    String(item.graceDays),
    item.reviewer,
    item.budget.toFixed(2),
    item.maximum.toFixed(2),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainManifestViews(items: DomainManifest[]): DomainManifestView[] {
  const views: DomainManifestView[] = [];
  for (const item of items) {
    views.push(toDomainManifestView(item));
  }
  return views;
}

export function sumDomainManifestView(view: DomainManifestView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedGraceDays + parsedBudget + parsedMaximum;
}
