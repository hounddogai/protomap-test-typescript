import * as text from "../../../../kit/text.js";
import { PaywallPolicy } from "./paywall-policy.js";

/** How screens and exports show a paywall policy. */
export class PaywallPolicyView {
  code: string;
  name: string;
  descriptionText: string;
  ceiling: string;
  summary: string;
  ratioText: string;
  createdAtText: string;
  localeText: string;
  windowDays: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    descriptionText: string,
    ceiling: string,
    summary: string,
    ratioText: string,
    createdAtText: string,
    localeText: string,
    windowDays: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.descriptionText = descriptionText;
    this.ceiling = ceiling;
    this.summary = summary;
    this.ratioText = ratioText;
    this.createdAtText = createdAtText;
    this.localeText = localeText;
    this.windowDays = windowDays;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallPolicyView(item: PaywallPolicy): PaywallPolicyView {
  return new PaywallPolicyView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 120),
    text.truncate(item.description, 120),
    item.ceiling.toFixed(2),
    item.summary,
    item.ratio.toFixed(2),
    String(item.createdAt),
    text.truncate(item.locale, 40),
    String(item.windowDays),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallPolicyViews(items: PaywallPolicy[]): PaywallPolicyView[] {
  const views: PaywallPolicyView[] = [];
  for (const item of items) {
    views.push(toPaywallPolicyView(item));
  }
  return views;
}

export function sumPaywallPolicyView(view: PaywallPolicyView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedCeiling + parsedRatio + parsedCreatedAt;
}
