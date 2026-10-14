import * as text from "../../../../kit/text.js";
import { SeasonalWaitAdjustment } from "./seasonal-wait-adjustment.js";

/** How screens and exports show a seasonal wait adjustment. */
export class SeasonalWaitAdjustmentView {
  codeText: string;
  label: string;
  minimum: string;
  revision: string;
  updatedAtText: string;
  visible: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    minimum: string,
    revision: string,
    updatedAtText: string,
    visible: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.minimum = minimum;
    this.revision = revision;
    this.updatedAtText = updatedAtText;
    this.visible = visible;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalWaitAdjustmentView(item: SeasonalWaitAdjustment): SeasonalWaitAdjustmentView {
  return new SeasonalWaitAdjustmentView(
    text.truncate(item.code, 120),
    item.label,
    item.minimum.toFixed(2),
    String(item.revision),
    String(item.updatedAt),
    `${item.visible}`,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalWaitAdjustmentViews(items: SeasonalWaitAdjustment[]): SeasonalWaitAdjustmentView[] {
  const views: SeasonalWaitAdjustmentView[] = [];
  for (const item of items) {
    views.push(toSeasonalWaitAdjustmentView(item));
  }
  return views;
}

export function sumSeasonalWaitAdjustmentView(view: SeasonalWaitAdjustmentView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedMinimum + parsedRevision + parsedUpdatedAt;
}
