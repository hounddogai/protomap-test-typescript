import { RegionalDomainClaim } from "./regional-domain-claim.js";

/** How screens and exports show a regional domain claim. */
export class RegionalDomainClaimView {
  codeText: string;
  name: string;
  rateText: string;
  discount: string;
  ceiling: string;
  reviewer: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    rateText: string,
    discount: string,
    ceiling: string,
    reviewer: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.rateText = rateText;
    this.discount = discount;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalDomainClaimView(item: RegionalDomainClaim): RegionalDomainClaimView {
  return new RegionalDomainClaimView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    item.discount.toFixed(2),
    item.ceiling.toFixed(2),
    item.reviewer,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalDomainClaimViews(items: RegionalDomainClaim[]): RegionalDomainClaimView[] {
  const views: RegionalDomainClaimView[] = [];
  for (const item of items) {
    views.push(toRegionalDomainClaimView(item));
  }
  return views;
}

export function sumRegionalDomainClaimView(view: RegionalDomainClaimView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedRate + parsedDiscount + parsedCeiling;
}
