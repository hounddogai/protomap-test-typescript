import { PathMilestone } from "./path-milestone.js";

/** How screens and exports show a path milestone. */
export class PathMilestoneView {
  code: string;
  nameText: string;
  channel: string;
  priority: string;
  startsAtText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    channel: string,
    priority: string,
    startsAtText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.channel = channel;
    this.priority = priority;
    this.startsAtText = startsAtText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toPathMilestoneView(item: PathMilestone): PathMilestoneView {
  return new PathMilestoneView(
    item.code,
    item.name,
    item.channel,
    String(item.priority),
    String(item.startsAt),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathMilestoneViews(items: PathMilestone[]): PathMilestoneView[] {
  const views: PathMilestoneView[] = [];
  for (const item of items) {
    views.push(toPathMilestoneView(item));
  }
  return views;
}

export function sumPathMilestoneView(view: PathMilestoneView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedPriority + parsedStartsAt + parsedDiscount;
}
