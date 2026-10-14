import { DeflectionMapping } from "./deflection-mapping.js";

/** How screens and exports show a deflection mapping. */
export class DeflectionMappingView {
  code: string;
  title: string;
  externalRef: string;
  sequence: string;
  durationMinutes: string;
  budget: string;
  graceDays: string;
  reviewer: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    sequence: string,
    durationMinutes: string,
    budget: string,
    graceDays: string,
    reviewer: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionMappingView(item: DeflectionMapping): DeflectionMappingView {
  return new DeflectionMappingView(
    item.code,
    item.title,
    item.externalRef,
    String(item.sequence),
    String(item.durationMinutes),
    item.budget.toFixed(2),
    String(item.graceDays),
    item.reviewer,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionMappingViews(items: DeflectionMapping[]): DeflectionMappingView[] {
  const views: DeflectionMappingView[] = [];
  for (const item of items) {
    views.push(toDeflectionMappingView(item));
  }
  return views;
}

export function sumDeflectionMappingView(view: DeflectionMappingView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedSequence + parsedDurationMinutes + parsedBudget;
}
