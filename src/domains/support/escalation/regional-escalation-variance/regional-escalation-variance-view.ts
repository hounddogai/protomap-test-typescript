import { RegionalEscalationVariance } from "./regional-escalation-variance.js";

/** How screens and exports show a regional escalation variance. */
export class RegionalEscalationVarianceView {
  codeText: string;
  nameText: string;
  category: string;
  journeyId: string;
  quantity: string;
  threshold: string;
  updatedAt: string;
  createdAtText: string;
  title: string;
  archived: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    category: string,
    journeyId: string,
    quantity: string,
    threshold: string,
    updatedAt: string,
    createdAtText: string,
    title: string,
    archived: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.category = category;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.createdAtText = createdAtText;
    this.title = title;
    this.archived = archived;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalEscalationVarianceView(item: RegionalEscalationVariance): RegionalEscalationVarianceView {
  return new RegionalEscalationVarianceView(
    item.code,
    item.name,
    item.category,
    item.journeyId,
    String(item.quantity),
    item.threshold.toFixed(2),
    String(item.updatedAt),
    String(item.createdAt),
    item.title,
    `${item.archived}`,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalEscalationVarianceViews(items: RegionalEscalationVariance[]): RegionalEscalationVarianceView[] {
  const views: RegionalEscalationVarianceView[] = [];
  for (const item of items) {
    views.push(toRegionalEscalationVarianceView(item));
  }
  return views;
}

export function sumRegionalEscalationVarianceView(view: RegionalEscalationVarianceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedQuantity + parsedThreshold + parsedUpdatedAt;
}
