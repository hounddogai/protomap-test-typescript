import * as text from "../../../../kit/text.js";
import { FallbackBranchPlan } from "./fallback-branch-plan.js";

/** How screens and exports show a fallback branch plan. */
export class FallbackBranchPlanView {
  code: string;
  name: string;
  segment: string;
  pinned: string;
  openRate: string;
  contactEmail: string;
  timezoneText: string;
  localeText: string;
  priority: string;
  attemptsText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segment: string,
    pinned: string,
    openRate: string,
    contactEmail: string,
    timezoneText: string,
    localeText: string,
    priority: string,
    attemptsText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.pinned = pinned;
    this.openRate = openRate;
    this.contactEmail = contactEmail;
    this.timezoneText = timezoneText;
    this.localeText = localeText;
    this.priority = priority;
    this.attemptsText = attemptsText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBranchPlanView(item: FallbackBranchPlan): FallbackBranchPlanView {
  return new FallbackBranchPlanView(
    text.truncate(item.code, 120),
    item.name,
    text.truncate(item.segment, 80),
    `${item.pinned}`,
    item.openRate.toFixed(2),
    item.contactEmail,
    text.truncate(item.timezone, 80),
    item.locale,
    String(item.priority),
    String(item.attempts),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBranchPlanViews(items: FallbackBranchPlan[]): FallbackBranchPlanView[] {
  const views: FallbackBranchPlanView[] = [];
  for (const item of items) {
    views.push(toFallbackBranchPlanView(item));
  }
  return views;
}

export function sumFallbackBranchPlanView(view: FallbackBranchPlanView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedOpenRate + parsedPriority + parsedAttempts;
}
