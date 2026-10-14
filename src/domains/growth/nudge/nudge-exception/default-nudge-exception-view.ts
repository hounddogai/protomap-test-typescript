import * as text from "../../../../kit/text.js";
import { DefaultNudgeException } from "./default-nudge-exception.js";

/** How screens and exports show a default nudge exception. */
export class DefaultNudgeExceptionView {
  code: string;
  label: string;
  expiresAt: string;
  channelText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    expiresAt: string,
    channelText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.channelText = channelText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultNudgeExceptionView(item: DefaultNudgeException): DefaultNudgeExceptionView {
  return new DefaultNudgeExceptionView(
    text.truncate(item.code, 80),
    item.label,
    String(item.expiresAt),
    item.channel,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultNudgeExceptionViews(items: DefaultNudgeException[]): DefaultNudgeExceptionView[] {
  const views: DefaultNudgeExceptionView[] = [];
  for (const item of items) {
    views.push(toDefaultNudgeExceptionView(item));
  }
  return views;
}

export function sumDefaultNudgeExceptionView(view: DefaultNudgeExceptionView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedExpiresAt + parsedDiscount;
}
