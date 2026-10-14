import { BidRuleAssignment } from "./bid-rule-assignment.js";

/** How screens and exports show a bid rule assignment. */
export class BidRuleAssignmentView {
  code: string;
  titleText: string;
  labelText: string;
  quantity: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    labelText: string,
    quantity: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.labelText = labelText;
    this.quantity = quantity;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleAssignmentView(item: BidRuleAssignment): BidRuleAssignmentView {
  return new BidRuleAssignmentView(
    item.code,
    item.title,
    item.label,
    String(item.quantity),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleAssignmentViews(items: BidRuleAssignment[]): BidRuleAssignmentView[] {
  const views: BidRuleAssignmentView[] = [];
  for (const item of items) {
    views.push(toBidRuleAssignmentView(item));
  }
  return views;
}

export function sumBidRuleAssignmentView(view: BidRuleAssignmentView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
