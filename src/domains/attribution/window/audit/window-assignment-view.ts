import * as text from "../../../../kit/text.js";
import { WindowAssignment } from "./window-assignment.js";

/** How screens and exports show a window assignment. */
export class WindowAssignmentView {
  code: string;
  name: string;
  limit: string;
  channelText: string;
  notes: string;
  sequence: string;
  budget: string;
  summary: string;
  score: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    channelText: string,
    notes: string,
    sequence: string,
    budget: string,
    summary: string,
    score: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.channelText = channelText;
    this.notes = notes;
    this.sequence = sequence;
    this.budget = budget;
    this.summary = summary;
    this.score = score;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowAssignmentView(item: WindowAssignment): WindowAssignmentView {
  return new WindowAssignmentView(
    text.truncate(item.code, 40),
    item.name,
    String(item.limit),
    item.channel,
    item.notes,
    String(item.sequence),
    item.budget.toFixed(2),
    item.summary,
    item.score.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowAssignmentViews(items: WindowAssignment[]): WindowAssignmentView[] {
  const views: WindowAssignmentView[] = [];
  for (const item of items) {
    views.push(toWindowAssignmentView(item));
  }
  return views;
}

export function sumWindowAssignmentView(view: WindowAssignmentView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedLimit + parsedSequence + parsedBudget;
}
