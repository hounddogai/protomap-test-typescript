import { OptOutGroup } from "./opt-out-group.js";

/** How screens and exports show a opt out group. */
export class OptOutGroupView {
  codeText: string;
  title: string;
  maximum: string;
  label: string;
  activeText: string;
  budget: string;
  localeText: string;
  utmSource: string;
  summary: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    maximum: string,
    label: string,
    activeText: string,
    budget: string,
    localeText: string,
    utmSource: string,
    summary: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.maximum = maximum;
    this.label = label;
    this.activeText = activeText;
    this.budget = budget;
    this.localeText = localeText;
    this.utmSource = utmSource;
    this.summary = summary;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutGroupView(item: OptOutGroup): OptOutGroupView {
  return new OptOutGroupView(
    item.code,
    item.title,
    item.maximum.toFixed(2),
    item.label,
    `${item.active}`,
    item.budget.toFixed(2),
    item.locale,
    item.utmSource,
    item.summary,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutGroupViews(items: OptOutGroup[]): OptOutGroupView[] {
  const views: OptOutGroupView[] = [];
  for (const item of items) {
    views.push(toOptOutGroupView(item));
  }
  return views;
}

export function sumOptOutGroupView(view: OptOutGroupView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedMaximum + parsedBudget + parsedExpiresAt;
}
