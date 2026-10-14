import * as text from "../../../../kit/text.js";
import { AdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

/** How screens and exports show a adaptive ticket view assignment. */
export class AdaptiveTicketViewAssignmentView {
  code: string;
  nameText: string;
  reviewer: string;
  descriptionText: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    reviewer: string,
    descriptionText: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.reviewer = reviewer;
    this.descriptionText = descriptionText;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveTicketViewAssignmentView(item: AdaptiveTicketViewAssignment): AdaptiveTicketViewAssignmentView {
  return new AdaptiveTicketViewAssignmentView(
    item.code,
    item.name,
    text.truncate(item.reviewer, 80),
    item.description,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveTicketViewAssignmentViews(items: AdaptiveTicketViewAssignment[]): AdaptiveTicketViewAssignmentView[] {
  const views: AdaptiveTicketViewAssignmentView[] = [];
  for (const item of items) {
    views.push(toAdaptiveTicketViewAssignmentView(item));
  }
  return views;
}

export function sumAdaptiveTicketViewAssignmentView(view: AdaptiveTicketViewAssignmentView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
