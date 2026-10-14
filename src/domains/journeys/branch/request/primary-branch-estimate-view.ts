import * as text from "../../../../kit/text.js";
import { PrimaryBranchEstimate } from "./primary-branch-estimate.js";

/** How screens and exports show a primary branch estimate. */
export class PrimaryBranchEstimateView {
  code: string;
  label: string;
  localeText: string;
  segment: string;
  margin: string;
  contactEmail: string;
  rateText: string;
  expiresAtText: string;
  campaignRef: string;
  createdAt: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    segment: string,
    margin: string,
    contactEmail: string,
    rateText: string,
    expiresAtText: string,
    campaignRef: string,
    createdAt: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.segment = segment;
    this.margin = margin;
    this.contactEmail = contactEmail;
    this.rateText = rateText;
    this.expiresAtText = expiresAtText;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryBranchEstimateView(item: PrimaryBranchEstimate): PrimaryBranchEstimateView {
  return new PrimaryBranchEstimateView(
    item.code,
    item.label,
    item.locale,
    text.truncate(item.segment, 120),
    item.margin.toFixed(2),
    item.contactEmail,
    item.rate.toFixed(2),
    String(item.expiresAt),
    item.campaignRef,
    String(item.createdAt),
    text.truncate(item.audienceId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryBranchEstimateViews(items: PrimaryBranchEstimate[]): PrimaryBranchEstimateView[] {
  const views: PrimaryBranchEstimateView[] = [];
  for (const item of items) {
    views.push(toPrimaryBranchEstimateView(item));
  }
  return views;
}

export function sumPrimaryBranchEstimateView(view: PrimaryBranchEstimateView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedMargin + parsedRate + parsedExpiresAt;
}
