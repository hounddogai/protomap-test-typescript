import * as text from "../../../../kit/text.js";
import { TieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

/** How screens and exports show a tiered cohort adjustment. */
export class TieredCohortAdjustmentView {
  code: string;
  name: string;
  ceilingText: string;
  createdAt: string;
  channel: string;
  descriptionText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ceilingText: string,
    createdAt: string,
    channel: string,
    descriptionText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ceilingText = ceilingText;
    this.createdAt = createdAt;
    this.channel = channel;
    this.descriptionText = descriptionText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toTieredCohortAdjustmentView(item: TieredCohortAdjustment): TieredCohortAdjustmentView {
  return new TieredCohortAdjustmentView(
    item.code,
    text.truncate(item.name, 64),
    item.ceiling.toFixed(2),
    String(item.createdAt),
    item.channel,
    item.description,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredCohortAdjustmentViews(items: TieredCohortAdjustment[]): TieredCohortAdjustmentView[] {
  const views: TieredCohortAdjustmentView[] = [];
  for (const item of items) {
    views.push(toTieredCohortAdjustmentView(item));
  }
  return views;
}

export function sumTieredCohortAdjustmentView(view: TieredCohortAdjustmentView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedCeiling + parsedCreatedAt + parsedQuantity;
}
