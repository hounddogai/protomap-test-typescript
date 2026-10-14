import * as text from "../../../../kit/text.js";
import { ManualTierPolicy } from "./manual-tier-policy.js";

/** How screens and exports show a manual tier policy. */
export class ManualTierPolicyView {
  code: string;
  name: string;
  pinned: string;
  localeText: string;
  cohort: string;
  approved: string;
  contactEmail: string;
  checksum: string;
  score: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    pinned: string,
    localeText: string,
    cohort: string,
    approved: string,
    contactEmail: string,
    checksum: string,
    score: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.localeText = localeText;
    this.cohort = cohort;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.score = score;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toManualTierPolicyView(item: ManualTierPolicy): ManualTierPolicyView {
  return new ManualTierPolicyView(
    item.code,
    item.name,
    `${item.pinned}`,
    item.locale,
    item.cohort,
    `${item.approved}`,
    text.truncate(item.contactEmail, 40),
    item.checksum,
    item.score.toFixed(2),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTierPolicyViews(items: ManualTierPolicy[]): ManualTierPolicyView[] {
  const views: ManualTierPolicyView[] = [];
  for (const item of items) {
    views.push(toManualTierPolicyView(item));
  }
  return views;
}

export function sumManualTierPolicyView(view: ManualTierPolicyView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedScore + parsedAmount;
}
