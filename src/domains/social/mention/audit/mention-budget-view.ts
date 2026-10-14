import { MentionBudget } from "./mention-budget.js";

/** How screens and exports show a mention budget. */
export class MentionBudgetView {
  codeText: string;
  labelText: string;
  quantityText: string;
  locale: string;
  summary: string;
  timezone: string;
  title: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    quantityText: string,
    locale: string,
    summary: string,
    timezone: string,
    title: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.quantityText = quantityText;
    this.locale = locale;
    this.summary = summary;
    this.timezone = timezone;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toMentionBudgetView(item: MentionBudget): MentionBudgetView {
  return new MentionBudgetView(
    item.code,
    item.label,
    String(item.quantity),
    item.locale,
    item.summary,
    item.timezone,
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionBudgetViews(items: MentionBudget[]): MentionBudgetView[] {
  const views: MentionBudgetView[] = [];
  for (const item of items) {
    views.push(toMentionBudgetView(item));
  }
  return views;
}

export function sumMentionBudgetView(view: MentionBudgetView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
