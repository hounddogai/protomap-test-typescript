import { PreferenceAssignment } from "./preference-assignment.js";

/** How screens and exports show a preference assignment. */
export class PreferenceAssignmentView {
  code: string;
  label: string;
  retries: string;
  clicks: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    clicks: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.clicks = clicks;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceAssignmentView(item: PreferenceAssignment): PreferenceAssignmentView {
  return new PreferenceAssignmentView(
    item.code,
    item.label,
    String(item.retries),
    String(item.clicks),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceAssignmentViews(items: PreferenceAssignment[]): PreferenceAssignmentView[] {
  const views: PreferenceAssignmentView[] = [];
  for (const item of items) {
    views.push(toPreferenceAssignmentView(item));
  }
  return views;
}

export function sumPreferenceAssignmentView(view: PreferenceAssignmentView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRetries + parsedClicks + parsedCreatedAt;
}
