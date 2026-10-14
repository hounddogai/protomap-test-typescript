import * as text from "../../../../kit/text.js";
import { FallbackRewardRuleAdjustment } from "./fallback-reward-rule-adjustment.js";

/** How screens and exports show a fallback reward rule adjustment. */
export class FallbackRewardRuleAdjustmentView {
  code: string;
  name: string;
  quantity: string;
  createdAt: string;
  description: string;
  contactEmail: string;
  visible: string;
  notes: string;
  locale: string;
  limit: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    createdAt: string,
    description: string,
    contactEmail: string,
    visible: string,
    notes: string,
    locale: string,
    limit: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.description = description;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.notes = notes;
    this.locale = locale;
    this.limit = limit;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackRewardRuleAdjustmentView(item: FallbackRewardRuleAdjustment): FallbackRewardRuleAdjustmentView {
  return new FallbackRewardRuleAdjustmentView(
    item.code,
    text.truncate(item.name, 80),
    String(item.quantity),
    String(item.createdAt),
    item.description,
    item.contactEmail,
    `${item.visible}`,
    item.notes,
    item.locale,
    String(item.limit),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackRewardRuleAdjustmentViews(items: FallbackRewardRuleAdjustment[]): FallbackRewardRuleAdjustmentView[] {
  const views: FallbackRewardRuleAdjustmentView[] = [];
  for (const item of items) {
    views.push(toFallbackRewardRuleAdjustmentView(item));
  }
  return views;
}

export function sumFallbackRewardRuleAdjustmentView(view: FallbackRewardRuleAdjustmentView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedQuantity + parsedCreatedAt + parsedLimit;
}
