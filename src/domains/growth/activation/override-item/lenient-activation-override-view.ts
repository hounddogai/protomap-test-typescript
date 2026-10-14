import * as text from "../../../../kit/text.js";
import { LenientActivationOverride } from "./lenient-activation-override.js";

/** How screens and exports show a lenient activation override. */
export class LenientActivationOverrideView {
  codeText: string;
  name: string;
  variant: string;
  ceiling: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    variant: string,
    ceiling: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.variant = variant;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toLenientActivationOverrideView(item: LenientActivationOverride): LenientActivationOverrideView {
  return new LenientActivationOverrideView(
    text.truncate(item.code, 80),
    item.name,
    item.variant,
    item.ceiling.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientActivationOverrideViews(items: LenientActivationOverride[]): LenientActivationOverrideView[] {
  const views: LenientActivationOverrideView[] = [];
  for (const item of items) {
    views.push(toLenientActivationOverrideView(item));
  }
  return views;
}

export function sumLenientActivationOverrideView(view: LenientActivationOverrideView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedCeiling + parsedSendAt;
}
