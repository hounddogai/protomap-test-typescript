import * as text from "../../../../kit/text.js";
import { AdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

/** How screens and exports show a adaptive approval agreement. */
export class AdaptiveApprovalAgreementView {
  codeText: string;
  labelText: string;
  startsAt: string;
  limit: string;
  scoreText: string;
  country: string;
  unitText: string;
  checksum: string;
  regionText: string;
  visibleText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    startsAt: string,
    limit: string,
    scoreText: string,
    country: string,
    unitText: string,
    checksum: string,
    regionText: string,
    visibleText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.startsAt = startsAt;
    this.limit = limit;
    this.scoreText = scoreText;
    this.country = country;
    this.unitText = unitText;
    this.checksum = checksum;
    this.regionText = regionText;
    this.visibleText = visibleText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveApprovalAgreementView(item: AdaptiveApprovalAgreement): AdaptiveApprovalAgreementView {
  return new AdaptiveApprovalAgreementView(
    text.truncate(item.code, 120),
    item.label,
    String(item.startsAt),
    String(item.limit),
    item.score.toFixed(2),
    item.country,
    item.unit,
    text.truncate(item.checksum, 40),
    item.region,
    `${item.visible}`,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveApprovalAgreementViews(items: AdaptiveApprovalAgreement[]): AdaptiveApprovalAgreementView[] {
  const views: AdaptiveApprovalAgreementView[] = [];
  for (const item of items) {
    views.push(toAdaptiveApprovalAgreementView(item));
  }
  return views;
}

export function sumAdaptiveApprovalAgreementView(view: AdaptiveApprovalAgreementView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedStartsAt + parsedLimit + parsedScore;
}
