import * as text from "../../../../kit/text.js";
import { RegionalDomainRollup } from "./regional-domain-rollup.js";

/** How screens and exports show a regional domain rollup. */
export class RegionalDomainRollupView {
  codeText: string;
  name: string;
  weight: string;
  variantText: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    weight: string,
    variantText: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.weight = weight;
    this.variantText = variantText;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalDomainRollupView(item: RegionalDomainRollup): RegionalDomainRollupView {
  return new RegionalDomainRollupView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    item.variant,
    text.truncate(item.utmSource, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalDomainRollupViews(items: RegionalDomainRollup[]): RegionalDomainRollupView[] {
  const views: RegionalDomainRollupView[] = [];
  for (const item of items) {
    views.push(toRegionalDomainRollupView(item));
  }
  return views;
}

export function sumRegionalDomainRollupView(view: RegionalDomainRollupView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedWeight;
}
