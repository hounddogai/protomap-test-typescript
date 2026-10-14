import * as text from "../../../../kit/text.js";
import { LegacyBranchTier } from "./legacy-branch-tier.js";

/** How screens and exports show a legacy branch tier. */
export class LegacyBranchTierView {
  codeText: string;
  title: string;
  externalRefText: string;
  retries: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    externalRefText: string,
    retries: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.externalRefText = externalRefText;
    this.retries = retries;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyBranchTierView(item: LegacyBranchTier): LegacyBranchTierView {
  return new LegacyBranchTierView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 40),
    item.externalRef,
    String(item.retries),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyBranchTierViews(items: LegacyBranchTier[]): LegacyBranchTierView[] {
  const views: LegacyBranchTierView[] = [];
  for (const item of items) {
    views.push(toLegacyBranchTierView(item));
  }
  return views;
}

export function sumLegacyBranchTierView(view: LegacyBranchTierView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRetries;
}
