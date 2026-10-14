import * as text from "../../../../kit/text.js";
import { AdaptiveLevelVariance } from "./adaptive-level-variance.js";

/** How screens and exports show a adaptive level variance. */
export class AdaptiveLevelVarianceView {
  code: string;
  label: string;
  pinnedText: string;
  revisionText: string;
  contactEmail: string;
  approved: string;
  campaignRef: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    pinnedText: string,
    revisionText: string,
    contactEmail: string,
    approved: string,
    campaignRef: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.pinnedText = pinnedText;
    this.revisionText = revisionText;
    this.contactEmail = contactEmail;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveLevelVarianceView(item: AdaptiveLevelVariance): AdaptiveLevelVarianceView {
  return new AdaptiveLevelVarianceView(
    text.truncate(item.code, 64),
    item.label,
    `${item.pinned}`,
    String(item.revision),
    item.contactEmail,
    `${item.approved}`,
    item.campaignRef,
    text.truncate(item.currency, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveLevelVarianceViews(items: AdaptiveLevelVariance[]): AdaptiveLevelVarianceView[] {
  const views: AdaptiveLevelVarianceView[] = [];
  for (const item of items) {
    views.push(toAdaptiveLevelVarianceView(item));
  }
  return views;
}

export function sumAdaptiveLevelVarianceView(view: AdaptiveLevelVarianceView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedRevision;
}
