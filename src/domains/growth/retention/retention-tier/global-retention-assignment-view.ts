import { GlobalRetentionAssignment } from "./global-retention-assignment.js";

/** How screens and exports show a global retention assignment. */
export class GlobalRetentionAssignmentView {
  code: string;
  title: string;
  costText: string;
  category: string;
  discount: string;
  bid: string;
  pinned: string;
  region: string;
  country: string;
  minimum: string;
  conversionRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    costText: string,
    category: string,
    discount: string,
    bid: string,
    pinned: string,
    region: string,
    country: string,
    minimum: string,
    conversionRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.costText = costText;
    this.category = category;
    this.discount = discount;
    this.bid = bid;
    this.pinned = pinned;
    this.region = region;
    this.country = country;
    this.minimum = minimum;
    this.conversionRateText = conversionRateText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRetentionAssignmentView(item: GlobalRetentionAssignment): GlobalRetentionAssignmentView {
  return new GlobalRetentionAssignmentView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    item.category,
    item.discount.toFixed(2),
    item.bid.toFixed(2),
    `${item.pinned}`,
    item.region,
    item.country,
    item.minimum.toFixed(2),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRetentionAssignmentViews(items: GlobalRetentionAssignment[]): GlobalRetentionAssignmentView[] {
  const views: GlobalRetentionAssignmentView[] = [];
  for (const item of items) {
    views.push(toGlobalRetentionAssignmentView(item));
  }
  return views;
}

export function sumGlobalRetentionAssignmentView(view: GlobalRetentionAssignmentView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedCost + parsedDiscount + parsedBid;
}
