import * as text from "../../../../kit/text.js";
import { PrimaryFunnelBaseline } from "./primary-funnel-baseline.js";

/** How screens and exports show a primary funnel baseline. */
export class PrimaryFunnelBaselineView {
  codeText: string;
  name: string;
  cohort: string;
  clicksText: string;
  sequenceText: string;
  variant: string;
  currency: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohort: string,
    clicksText: string,
    sequenceText: string,
    variant: string,
    currency: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohort = cohort;
    this.clicksText = clicksText;
    this.sequenceText = sequenceText;
    this.variant = variant;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFunnelBaselineView(item: PrimaryFunnelBaseline): PrimaryFunnelBaselineView {
  return new PrimaryFunnelBaselineView(
    item.code,
    item.name,
    text.truncate(item.cohort, 40),
    String(item.clicks),
    String(item.sequence),
    item.variant,
    item.currency,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFunnelBaselineViews(items: PrimaryFunnelBaseline[]): PrimaryFunnelBaselineView[] {
  const views: PrimaryFunnelBaselineView[] = [];
  for (const item of items) {
    views.push(toPrimaryFunnelBaselineView(item));
  }
  return views;
}

export function sumPrimaryFunnelBaselineView(view: PrimaryFunnelBaselineView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedClicks + parsedSequence;
}
