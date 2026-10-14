import * as text from "../../../../kit/text.js";
import { PaywallAssignment } from "./paywall-assignment.js";

/** How screens and exports show a paywall assignment. */
export class PaywallAssignmentView {
  code: string;
  title: string;
  visible: string;
  budget: string;
  country: string;
  variantText: string;
  updatedAtText: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visible: string,
    budget: string,
    country: string,
    variantText: string,
    updatedAtText: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.budget = budget;
    this.country = country;
    this.variantText = variantText;
    this.updatedAtText = updatedAtText;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallAssignmentView(item: PaywallAssignment): PaywallAssignmentView {
  return new PaywallAssignmentView(
    item.code,
    item.title,
    `${item.visible}`,
    item.budget.toFixed(2),
    text.truncate(item.country, 40),
    item.variant,
    String(item.updatedAt),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallAssignmentViews(items: PaywallAssignment[]): PaywallAssignmentView[] {
  const views: PaywallAssignmentView[] = [];
  for (const item of items) {
    views.push(toPaywallAssignmentView(item));
  }
  return views;
}

export function sumPaywallAssignmentView(view: PaywallAssignmentView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedBudget + parsedUpdatedAt;
}
