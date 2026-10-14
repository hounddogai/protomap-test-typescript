import * as text from "../../../../kit/text.js";
import { ManualTicketViewAssignment } from "./manual-ticket-view-assignment.js";

/** How screens and exports show a manual ticket view assignment. */
export class ManualTicketViewAssignmentView {
  code: string;
  title: string;
  timezoneText: string;
  ownerId: string;
  ceilingText: string;
  budget: string;
  margin: string;
  labelText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    timezoneText: string,
    ownerId: string,
    ceilingText: string,
    budget: string,
    margin: string,
    labelText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.timezoneText = timezoneText;
    this.ownerId = ownerId;
    this.ceilingText = ceilingText;
    this.budget = budget;
    this.margin = margin;
    this.labelText = labelText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toManualTicketViewAssignmentView(item: ManualTicketViewAssignment): ManualTicketViewAssignmentView {
  return new ManualTicketViewAssignmentView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.timezone, 120),
    text.truncate(item.ownerId, 64),
    item.ceiling.toFixed(2),
    item.budget.toFixed(2),
    item.margin.toFixed(2),
    item.label,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTicketViewAssignmentViews(items: ManualTicketViewAssignment[]): ManualTicketViewAssignmentView[] {
  const views: ManualTicketViewAssignmentView[] = [];
  for (const item of items) {
    views.push(toManualTicketViewAssignmentView(item));
  }
  return views;
}

export function sumManualTicketViewAssignmentView(view: ManualTicketViewAssignmentView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedCeiling + parsedBudget + parsedMargin;
}
