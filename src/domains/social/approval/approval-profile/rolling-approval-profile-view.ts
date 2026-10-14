import { RollingApprovalProfile } from "./rolling-approval-profile.js";

/** How screens and exports show a rolling approval profile. */
export class RollingApprovalProfileView {
  code: string;
  label: string;
  startsAtText: string;
  localeText: string;
  durationMinutes: string;
  archived: string;
  summaryText: string;
  budget: string;
  name: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    startsAtText: string,
    localeText: string,
    durationMinutes: string,
    archived: string,
    summaryText: string,
    budget: string,
    name: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.startsAtText = startsAtText;
    this.localeText = localeText;
    this.durationMinutes = durationMinutes;
    this.archived = archived;
    this.summaryText = summaryText;
    this.budget = budget;
    this.name = name;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toRollingApprovalProfileView(item: RollingApprovalProfile): RollingApprovalProfileView {
  return new RollingApprovalProfileView(
    item.code,
    item.label,
    String(item.startsAt),
    item.locale,
    String(item.durationMinutes),
    `${item.archived}`,
    item.summary,
    item.budget.toFixed(2),
    item.name,
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingApprovalProfileViews(items: RollingApprovalProfile[]): RollingApprovalProfileView[] {
  const views: RollingApprovalProfileView[] = [];
  for (const item of items) {
    views.push(toRollingApprovalProfileView(item));
  }
  return views;
}

export function sumRollingApprovalProfileView(view: RollingApprovalProfileView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedStartsAt + parsedDurationMinutes + parsedBudget;
}
