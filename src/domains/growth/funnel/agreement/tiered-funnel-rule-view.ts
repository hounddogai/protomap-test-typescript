import * as text from "../../../../kit/text.js";
import { TieredFunnelRule } from "./tiered-funnel-rule.js";

/** How screens and exports show a tiered funnel rule. */
export class TieredFunnelRuleView {
  code: string;
  title: string;
  expiresAt: string;
  margin: string;
  endsAt: string;
  timezone: string;
  descriptionText: string;
  sourceText: string;
  weightText: string;
  label: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAt: string,
    margin: string,
    endsAt: string,
    timezone: string,
    descriptionText: string,
    sourceText: string,
    weightText: string,
    label: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.descriptionText = descriptionText;
    this.sourceText = sourceText;
    this.weightText = weightText;
    this.label = label;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFunnelRuleView(item: TieredFunnelRule): TieredFunnelRuleView {
  return new TieredFunnelRuleView(
    text.truncate(item.code, 40),
    item.title,
    String(item.expiresAt),
    item.margin.toFixed(2),
    String(item.endsAt),
    item.timezone,
    item.description,
    text.truncate(item.source, 120),
    item.weight.toFixed(2),
    text.truncate(item.label, 64),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFunnelRuleViews(items: TieredFunnelRule[]): TieredFunnelRuleView[] {
  const views: TieredFunnelRuleView[] = [];
  for (const item of items) {
    views.push(toTieredFunnelRuleView(item));
  }
  return views;
}

export function sumTieredFunnelRuleView(view: TieredFunnelRuleView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedExpiresAt + parsedMargin + parsedEndsAt;
}
