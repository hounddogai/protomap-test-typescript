import * as text from "../../../../kit/text.js";
import { CappedLevelAdjustment } from "./capped-level-adjustment.js";

/** How screens and exports show a capped level adjustment. */
export class CappedLevelAdjustmentView {
  code: string;
  name: string;
  revisionText: string;
  phone: string;
  audienceId: string;
  ratioText: string;
  timezone: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revisionText: string,
    phone: string,
    audienceId: string,
    ratioText: string,
    timezone: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revisionText = revisionText;
    this.phone = phone;
    this.audienceId = audienceId;
    this.ratioText = ratioText;
    this.timezone = timezone;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toCappedLevelAdjustmentView(item: CappedLevelAdjustment): CappedLevelAdjustmentView {
  return new CappedLevelAdjustmentView(
    item.code,
    text.truncate(item.name, 64),
    String(item.revision),
    item.phone,
    item.audienceId,
    item.ratio.toFixed(2),
    item.timezone,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedLevelAdjustmentViews(items: CappedLevelAdjustment[]): CappedLevelAdjustmentView[] {
  const views: CappedLevelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toCappedLevelAdjustmentView(item));
  }
  return views;
}

export function sumCappedLevelAdjustmentView(view: CappedLevelAdjustmentView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRevision + parsedRatio + parsedBudget;
}
