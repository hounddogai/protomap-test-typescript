import { PostMilestone } from "./post-milestone.js";

/** How screens and exports show a post milestone. */
export class PostMilestoneView {
  code: string;
  name: string;
  retriesText: string;
  cost: string;
  ownerId: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retriesText: string,
    cost: string,
    ownerId: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retriesText = retriesText;
    this.cost = cost;
    this.ownerId = ownerId;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toPostMilestoneView(item: PostMilestone): PostMilestoneView {
  return new PostMilestoneView(
    item.code,
    item.name,
    String(item.retries),
    item.cost.toFixed(2),
    item.ownerId,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostMilestoneViews(items: PostMilestone[]): PostMilestoneView[] {
  const views: PostMilestoneView[] = [];
  for (const item of items) {
    views.push(toPostMilestoneView(item));
  }
  return views;
}

export function sumPostMilestoneView(view: PostMilestoneView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedRetries + parsedCost;
}
