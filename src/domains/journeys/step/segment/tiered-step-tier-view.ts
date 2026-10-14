import * as text from "../../../../kit/text.js";
import { TieredStepTier } from "./tiered-step-tier.js";

/** How screens and exports show a tiered step tier. */
export class TieredStepTierView {
  code: string;
  name: string;
  revision: string;
  reviewer: string;
  createdAtText: string;
  visibleText: string;
  currencyText: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revision: string,
    reviewer: string,
    createdAtText: string,
    visibleText: string,
    currencyText: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.reviewer = reviewer;
    this.createdAtText = createdAtText;
    this.visibleText = visibleText;
    this.currencyText = currencyText;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredStepTierView(item: TieredStepTier): TieredStepTierView {
  return new TieredStepTierView(
    item.code,
    item.name,
    String(item.revision),
    item.reviewer,
    String(item.createdAt),
    `${item.visible}`,
    text.truncate(item.currency, 64),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredStepTierViews(items: TieredStepTier[]): TieredStepTierView[] {
  const views: TieredStepTierView[] = [];
  for (const item of items) {
    views.push(toTieredStepTierView(item));
  }
  return views;
}

export function sumTieredStepTierView(view: TieredStepTierView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedRevision + parsedCreatedAt + parsedCeiling;
}
