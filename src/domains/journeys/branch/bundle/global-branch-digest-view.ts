import * as text from "../../../../kit/text.js";
import { GlobalBranchDigest } from "./global-branch-digest.js";

/** How screens and exports show a global branch digest. */
export class GlobalBranchDigestView {
  code: string;
  label: string;
  activeText: string;
  amountText: string;
  budget: string;
  version: string;
  checksum: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    activeText: string,
    amountText: string,
    budget: string,
    version: string,
    checksum: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.activeText = activeText;
    this.amountText = amountText;
    this.budget = budget;
    this.version = version;
    this.checksum = checksum;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBranchDigestView(item: GlobalBranchDigest): GlobalBranchDigestView {
  return new GlobalBranchDigestView(
    item.code,
    text.truncate(item.label, 40),
    `${item.active}`,
    item.amount.toFixed(2),
    item.budget.toFixed(2),
    String(item.version),
    item.checksum,
    text.truncate(item.timezone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBranchDigestViews(items: GlobalBranchDigest[]): GlobalBranchDigestView[] {
  const views: GlobalBranchDigestView[] = [];
  for (const item of items) {
    views.push(toGlobalBranchDigestView(item));
  }
  return views;
}

export function sumGlobalBranchDigestView(view: GlobalBranchDigestView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedAmount + parsedBudget + parsedVersion;
}
