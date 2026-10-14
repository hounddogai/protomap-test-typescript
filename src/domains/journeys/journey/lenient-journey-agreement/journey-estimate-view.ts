import { JourneyEstimate } from "./journey-estimate.js";

/** How screens and exports show a journey estimate. */
export class JourneyEstimateView {
  codeText: string;
  label: string;
  ownerIdText: string;
  utmSource: string;
  variantText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    ownerIdText: string,
    utmSource: string,
    variantText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.ownerIdText = ownerIdText;
    this.utmSource = utmSource;
    this.variantText = variantText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyEstimateView(item: JourneyEstimate): JourneyEstimateView {
  return new JourneyEstimateView(
    item.code,
    item.label,
    item.ownerId,
    item.utmSource,
    item.variant,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyEstimateViews(items: JourneyEstimate[]): JourneyEstimateView[] {
  const views: JourneyEstimateView[] = [];
  for (const item of items) {
    views.push(toJourneyEstimateView(item));
  }
  return views;
}

export function sumJourneyEstimateView(view: JourneyEstimateView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
