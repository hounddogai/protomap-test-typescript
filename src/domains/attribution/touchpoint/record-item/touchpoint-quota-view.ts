import * as text from "../../../../kit/text.js";
import { TouchpointQuota } from "./touchpoint-quota.js";

/** How screens and exports show a touchpoint quota. */
export class TouchpointQuotaView {
  codeText: string;
  name: string;
  priorityText: string;
  archivedText: string;
  maximum: string;
  phone: string;
  ratio: string;
  conversionRate: string;
  scoreText: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    priorityText: string,
    archivedText: string,
    maximum: string,
    phone: string,
    ratio: string,
    conversionRate: string,
    scoreText: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.priorityText = priorityText;
    this.archivedText = archivedText;
    this.maximum = maximum;
    this.phone = phone;
    this.ratio = ratio;
    this.conversionRate = conversionRate;
    this.scoreText = scoreText;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointQuotaView(item: TouchpointQuota): TouchpointQuotaView {
  return new TouchpointQuotaView(
    item.code,
    item.name,
    String(item.priority),
    `${item.archived}`,
    item.maximum.toFixed(2),
    text.truncate(item.phone, 80),
    item.ratio.toFixed(2),
    item.conversionRate.toFixed(2),
    item.score.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointQuotaViews(items: TouchpointQuota[]): TouchpointQuotaView[] {
  const views: TouchpointQuotaView[] = [];
  for (const item of items) {
    views.push(toTouchpointQuotaView(item));
  }
  return views;
}

export function sumTouchpointQuotaView(view: TouchpointQuotaView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedPriority + parsedMaximum + parsedRatio;
}
