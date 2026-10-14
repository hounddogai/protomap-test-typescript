import * as text from "../../../../kit/text.js";
import { LegacyActivationException } from "./legacy-activation-exception.js";

/** How screens and exports show a legacy activation exception. */
export class LegacyActivationExceptionView {
  code: string;
  nameText: string;
  quantity: string;
  label: string;
  campaignRef: string;
  endsAt: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    quantity: string,
    label: string,
    campaignRef: string,
    endsAt: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.quantity = quantity;
    this.label = label;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyActivationExceptionView(item: LegacyActivationException): LegacyActivationExceptionView {
  return new LegacyActivationExceptionView(
    text.truncate(item.code, 40),
    item.name,
    String(item.quantity),
    text.truncate(item.label, 80),
    text.truncate(item.campaignRef, 40),
    String(item.endsAt),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyActivationExceptionViews(items: LegacyActivationException[]): LegacyActivationExceptionView[] {
  const views: LegacyActivationExceptionView[] = [];
  for (const item of items) {
    views.push(toLegacyActivationExceptionView(item));
  }
  return views;
}

export function sumLegacyActivationExceptionView(view: LegacyActivationExceptionView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedQuantity + parsedEndsAt + parsedLimit;
}
