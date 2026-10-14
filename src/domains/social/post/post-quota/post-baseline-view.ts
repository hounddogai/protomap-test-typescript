import { PostBaseline } from "./post-baseline.js";

/** How screens and exports show a post baseline. */
export class PostBaselineView {
  code: string;
  titleText: string;
  maximum: string;
  descriptionText: string;
  endsAt: string;
  visible: string;
  budget: string;
  locale: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    maximum: string,
    descriptionText: string,
    endsAt: string,
    visible: string,
    budget: string,
    locale: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.maximum = maximum;
    this.descriptionText = descriptionText;
    this.endsAt = endsAt;
    this.visible = visible;
    this.budget = budget;
    this.locale = locale;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toPostBaselineView(item: PostBaseline): PostBaselineView {
  return new PostBaselineView(
    item.code,
    item.title,
    item.maximum.toFixed(2),
    item.description,
    String(item.endsAt),
    `${item.visible}`,
    item.budget.toFixed(2),
    item.locale,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostBaselineViews(items: PostBaseline[]): PostBaselineView[] {
  const views: PostBaselineView[] = [];
  for (const item of items) {
    views.push(toPostBaselineView(item));
  }
  return views;
}

export function sumPostBaselineView(view: PostBaselineView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedMaximum + parsedEndsAt + parsedBudget;
}
