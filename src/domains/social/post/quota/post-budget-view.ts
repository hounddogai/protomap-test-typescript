import * as text from "../../../../kit/text.js";
import { PostBudget } from "./post-budget.js";

/** How screens and exports show a post budget. */
export class PostBudgetView {
  code: string;
  title: string;
  updatedAt: string;
  category: string;
  expiresAtText: string;
  unit: string;
  startsAtText: string;
  margin: string;
  name: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    updatedAt: string,
    category: string,
    expiresAtText: string,
    unit: string,
    startsAtText: string,
    margin: string,
    name: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.category = category;
    this.expiresAtText = expiresAtText;
    this.unit = unit;
    this.startsAtText = startsAtText;
    this.margin = margin;
    this.name = name;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toPostBudgetView(item: PostBudget): PostBudgetView {
  return new PostBudgetView(
    item.code,
    item.title,
    String(item.updatedAt),
    item.category,
    String(item.expiresAt),
    item.unit,
    String(item.startsAt),
    item.margin.toFixed(2),
    text.truncate(item.name, 80),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostBudgetViews(items: PostBudget[]): PostBudgetView[] {
  const views: PostBudgetView[] = [];
  for (const item of items) {
    views.push(toPostBudgetView(item));
  }
  return views;
}

export function sumPostBudgetView(view: PostBudgetView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedUpdatedAt + parsedExpiresAt + parsedStartsAt;
}
