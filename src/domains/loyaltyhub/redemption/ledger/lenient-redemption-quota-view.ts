import * as text from "../../../../kit/text.js";
import { LenientRedemptionQuota } from "./lenient-redemption-quota.js";

/** How screens and exports show a lenient redemption quota. */
export class LenientRedemptionQuotaView {
  code: string;
  nameText: string;
  sequenceText: string;
  active: string;
  revision: string;
  maximum: string;
  contactEmail: string;
  sourceText: string;
  scoreText: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    sequenceText: string,
    active: string,
    revision: string,
    maximum: string,
    contactEmail: string,
    sourceText: string,
    scoreText: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.sequenceText = sequenceText;
    this.active = active;
    this.revision = revision;
    this.maximum = maximum;
    this.contactEmail = contactEmail;
    this.sourceText = sourceText;
    this.scoreText = scoreText;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRedemptionQuotaView(item: LenientRedemptionQuota): LenientRedemptionQuotaView {
  return new LenientRedemptionQuotaView(
    text.truncate(item.code, 120),
    item.name,
    String(item.sequence),
    `${item.active}`,
    String(item.revision),
    item.maximum.toFixed(2),
    item.contactEmail,
    item.source,
    item.score.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRedemptionQuotaViews(items: LenientRedemptionQuota[]): LenientRedemptionQuotaView[] {
  const views: LenientRedemptionQuotaView[] = [];
  for (const item of items) {
    views.push(toLenientRedemptionQuotaView(item));
  }
  return views;
}

export function sumLenientRedemptionQuotaView(view: LenientRedemptionQuotaView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedSequence + parsedRevision + parsedMaximum;
}
