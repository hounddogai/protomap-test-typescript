import * as text from "../../../../kit/text.js";
import { LegacySuppressionClaim } from "./legacy-suppression-claim.js";

/** How screens and exports show a legacy suppression claim. */
export class LegacySuppressionClaimView {
  code: string;
  name: string;
  countryText: string;
  revision: string;
  reviewer: string;
  variantText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    countryText: string,
    revision: string,
    reviewer: string,
    variantText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.countryText = countryText;
    this.revision = revision;
    this.reviewer = reviewer;
    this.variantText = variantText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySuppressionClaimView(item: LegacySuppressionClaim): LegacySuppressionClaimView {
  return new LegacySuppressionClaimView(
    item.code,
    text.truncate(item.name, 40),
    item.country,
    String(item.revision),
    item.reviewer,
    item.variant,
    text.truncate(item.segment, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySuppressionClaimViews(items: LegacySuppressionClaim[]): LegacySuppressionClaimView[] {
  const views: LegacySuppressionClaimView[] = [];
  for (const item of items) {
    views.push(toLegacySuppressionClaimView(item));
  }
  return views;
}

export function sumLegacySuppressionClaimView(view: LegacySuppressionClaimView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
