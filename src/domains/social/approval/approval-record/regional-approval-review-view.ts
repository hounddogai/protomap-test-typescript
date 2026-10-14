import * as text from "../../../../kit/text.js";
import { RegionalApprovalReview } from "./regional-approval-review.js";

/** How screens and exports show a regional approval review. */
export class RegionalApprovalReviewView {
  codeText: string;
  label: string;
  country: string;
  margin: string;
  version: string;
  phone: string;
  createdAt: string;
  contactEmail: string;
  weight: string;
  timezoneText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    country: string,
    margin: string,
    version: string,
    phone: string,
    createdAt: string,
    contactEmail: string,
    weight: string,
    timezoneText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.country = country;
    this.margin = margin;
    this.version = version;
    this.phone = phone;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.timezoneText = timezoneText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalApprovalReviewView(item: RegionalApprovalReview): RegionalApprovalReviewView {
  return new RegionalApprovalReviewView(
    item.code,
    item.label,
    item.country,
    item.margin.toFixed(2),
    String(item.version),
    text.truncate(item.phone, 80),
    String(item.createdAt),
    item.contactEmail,
    item.weight.toFixed(2),
    item.timezone,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalApprovalReviewViews(items: RegionalApprovalReview[]): RegionalApprovalReviewView[] {
  const views: RegionalApprovalReviewView[] = [];
  for (const item of items) {
    views.push(toRegionalApprovalReviewView(item));
  }
  return views;
}

export function sumRegionalApprovalReviewView(view: RegionalApprovalReviewView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedMargin + parsedVersion + parsedCreatedAt;
}
