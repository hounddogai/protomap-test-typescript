import * as text from "../../../../kit/text.js";
import { SeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

/** How screens and exports show a seasonal double opt in audit. */
export class SeasonalDoubleOptInAuditView {
  code: string;
  label: string;
  channel: string;
  endsAt: string;
  quantity: string;
  cost: string;
  weight: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    endsAt: string,
    quantity: string,
    cost: string,
    weight: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.cost = cost;
    this.weight = weight;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalDoubleOptInAuditView(item: SeasonalDoubleOptInAudit): SeasonalDoubleOptInAuditView {
  return new SeasonalDoubleOptInAuditView(
    item.code,
    item.label,
    text.truncate(item.channel, 120),
    String(item.endsAt),
    String(item.quantity),
    item.cost.toFixed(2),
    item.weight.toFixed(2),
    text.truncate(item.description, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalDoubleOptInAuditViews(items: SeasonalDoubleOptInAudit[]): SeasonalDoubleOptInAuditView[] {
  const views: SeasonalDoubleOptInAuditView[] = [];
  for (const item of items) {
    views.push(toSeasonalDoubleOptInAuditView(item));
  }
  return views;
}

export function sumSeasonalDoubleOptInAuditView(view: SeasonalDoubleOptInAuditView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedEndsAt + parsedQuantity + parsedCost;
}
