import * as text from "../../../../kit/text.js";
import { ApprovalManifest } from "./approval-manifest.js";

/** How screens and exports show a approval manifest. */
export class ApprovalManifestView {
  code: string;
  name: string;
  reviewerText: string;
  limit: string;
  weight: string;
  visible: string;
  approvedText: string;
  durationMinutesText: string;
  openRateText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    reviewerText: string,
    limit: string,
    weight: string,
    visible: string,
    approvedText: string,
    durationMinutesText: string,
    openRateText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.reviewerText = reviewerText;
    this.limit = limit;
    this.weight = weight;
    this.visible = visible;
    this.approvedText = approvedText;
    this.durationMinutesText = durationMinutesText;
    this.openRateText = openRateText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalManifestView(item: ApprovalManifest): ApprovalManifestView {
  return new ApprovalManifestView(
    item.code,
    item.name,
    text.truncate(item.reviewer, 120),
    String(item.limit),
    item.weight.toFixed(2),
    `${item.visible}`,
    `${item.approved}`,
    String(item.durationMinutes),
    item.openRate.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalManifestViews(items: ApprovalManifest[]): ApprovalManifestView[] {
  const views: ApprovalManifestView[] = [];
  for (const item of items) {
    views.push(toApprovalManifestView(item));
  }
  return views;
}

export function sumApprovalManifestView(view: ApprovalManifestView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedLimit + parsedWeight + parsedDurationMinutes;
}
