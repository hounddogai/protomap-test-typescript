import { DefaultOptOutRule } from "./default-opt-out-rule.js";

/** How screens and exports show a default opt out rule. */
export class DefaultOptOutRuleView {
  codeText: string;
  nameText: string;
  ownerIdText: string;
  channel: string;
  ratio: string;
  expiresAt: string;
  journeyIdText: string;
  margin: string;
  category: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    ownerIdText: string,
    channel: string,
    ratio: string,
    expiresAt: string,
    journeyIdText: string,
    margin: string,
    category: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.ownerIdText = ownerIdText;
    this.channel = channel;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.journeyIdText = journeyIdText;
    this.margin = margin;
    this.category = category;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultOptOutRuleView(item: DefaultOptOutRule): DefaultOptOutRuleView {
  return new DefaultOptOutRuleView(
    item.code,
    item.name,
    item.ownerId,
    item.channel,
    item.ratio.toFixed(2),
    String(item.expiresAt),
    item.journeyId,
    item.margin.toFixed(2),
    item.category,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultOptOutRuleViews(items: DefaultOptOutRule[]): DefaultOptOutRuleView[] {
  const views: DefaultOptOutRuleView[] = [];
  for (const item of items) {
    views.push(toDefaultOptOutRuleView(item));
  }
  return views;
}

export function sumDefaultOptOutRuleView(view: DefaultOptOutRuleView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRatio + parsedExpiresAt + parsedMargin;
}
