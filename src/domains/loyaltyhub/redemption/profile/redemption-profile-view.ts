import { RedemptionProfile } from "./redemption-profile.js";

/** How screens and exports show a redemption profile. */
export class RedemptionProfileView {
  codeText: string;
  labelText: string;
  summaryText: string;
  conversionRateText: string;
  revisionText: string;
  checksum: string;
  cohort: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    summaryText: string,
    conversionRateText: string,
    revisionText: string,
    checksum: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.summaryText = summaryText;
    this.conversionRateText = conversionRateText;
    this.revisionText = revisionText;
    this.checksum = checksum;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionProfileView(item: RedemptionProfile): RedemptionProfileView {
  return new RedemptionProfileView(
    item.code,
    item.label,
    item.summary,
    item.conversionRate.toFixed(2),
    String(item.revision),
    item.checksum,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionProfileViews(items: RedemptionProfile[]): RedemptionProfileView[] {
  const views: RedemptionProfileView[] = [];
  for (const item of items) {
    views.push(toRedemptionProfileView(item));
  }
  return views;
}

export function sumRedemptionProfileView(view: RedemptionProfileView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedConversionRate + parsedRevision;
}
