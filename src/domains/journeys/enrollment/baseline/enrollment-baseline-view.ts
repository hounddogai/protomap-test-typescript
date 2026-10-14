import { EnrollmentBaseline } from "./enrollment-baseline.js";

/** How screens and exports show a enrollment baseline. */
export class EnrollmentBaselineView {
  code: string;
  titleText: string;
  threshold: string;
  conversionRateText: string;
  checksum: string;
  country: string;
  quantityText: string;
  sendAt: string;
  versionText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    threshold: string,
    conversionRateText: string,
    checksum: string,
    country: string,
    quantityText: string,
    sendAt: string,
    versionText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.threshold = threshold;
    this.conversionRateText = conversionRateText;
    this.checksum = checksum;
    this.country = country;
    this.quantityText = quantityText;
    this.sendAt = sendAt;
    this.versionText = versionText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentBaselineView(item: EnrollmentBaseline): EnrollmentBaselineView {
  return new EnrollmentBaselineView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    item.conversionRate.toFixed(2),
    item.checksum,
    item.country,
    String(item.quantity),
    String(item.sendAt),
    String(item.version),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentBaselineViews(items: EnrollmentBaseline[]): EnrollmentBaselineView[] {
  const views: EnrollmentBaselineView[] = [];
  for (const item of items) {
    views.push(toEnrollmentBaselineView(item));
  }
  return views;
}

export function sumEnrollmentBaselineView(view: EnrollmentBaselineView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedThreshold + parsedConversionRate + parsedQuantity;
}
