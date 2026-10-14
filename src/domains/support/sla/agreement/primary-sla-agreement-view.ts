import { PrimarySlaAgreement } from "./primary-sla-agreement.js";

/** How screens and exports show a primary sla agreement. */
export class PrimarySlaAgreementView {
  code: string;
  title: string;
  quantityText: string;
  threshold: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    quantityText: string,
    threshold: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.quantityText = quantityText;
    this.threshold = threshold;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySlaAgreementView(item: PrimarySlaAgreement): PrimarySlaAgreementView {
  return new PrimarySlaAgreementView(
    item.code,
    item.title,
    String(item.quantity),
    item.threshold.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySlaAgreementViews(items: PrimarySlaAgreement[]): PrimarySlaAgreementView[] {
  const views: PrimarySlaAgreementView[] = [];
  for (const item of items) {
    views.push(toPrimarySlaAgreementView(item));
  }
  return views;
}

export function sumPrimarySlaAgreementView(view: PrimarySlaAgreementView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedQuantity + parsedThreshold + parsedImpressions;
}
