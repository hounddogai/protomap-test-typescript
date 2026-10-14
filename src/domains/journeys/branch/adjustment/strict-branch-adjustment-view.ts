import * as text from "../../../../kit/text.js";
import { StrictBranchAdjustment } from "./strict-branch-adjustment.js";

/** How screens and exports show a strict branch adjustment. */
export class StrictBranchAdjustmentView {
  code: string;
  name: string;
  createdAt: string;
  contactEmailText: string;
  approved: string;
  phoneText: string;
  endsAt: string;
  impressions: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAt: string,
    contactEmailText: string,
    approved: string,
    phoneText: string,
    endsAt: string,
    impressions: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.contactEmailText = contactEmailText;
    this.approved = approved;
    this.phoneText = phoneText;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBranchAdjustmentView(item: StrictBranchAdjustment): StrictBranchAdjustmentView {
  return new StrictBranchAdjustmentView(
    item.code,
    text.truncate(item.name, 40),
    String(item.createdAt),
    item.contactEmail,
    `${item.approved}`,
    item.phone,
    String(item.endsAt),
    String(item.impressions),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBranchAdjustmentViews(items: StrictBranchAdjustment[]): StrictBranchAdjustmentView[] {
  const views: StrictBranchAdjustmentView[] = [];
  for (const item of items) {
    views.push(toStrictBranchAdjustmentView(item));
  }
  return views;
}

export function sumStrictBranchAdjustmentView(view: StrictBranchAdjustmentView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedCreatedAt + parsedEndsAt + parsedImpressions;
}
