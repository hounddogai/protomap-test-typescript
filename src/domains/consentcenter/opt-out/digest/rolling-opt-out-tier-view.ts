import { RollingOptOutTier } from "./rolling-opt-out-tier.js";

/** How screens and exports show a rolling opt out tier. */
export class RollingOptOutTierView {
  code: string;
  titleText: string;
  durationMinutes: string;
  approvedText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    durationMinutes: string,
    approvedText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.durationMinutes = durationMinutes;
    this.approvedText = approvedText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toRollingOptOutTierView(item: RollingOptOutTier): RollingOptOutTierView {
  return new RollingOptOutTierView(
    item.code,
    item.title,
    String(item.durationMinutes),
    `${item.approved}`,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingOptOutTierViews(items: RollingOptOutTier[]): RollingOptOutTierView[] {
  const views: RollingOptOutTierView[] = [];
  for (const item of items) {
    views.push(toRollingOptOutTierView(item));
  }
  return views;
}

export function sumRollingOptOutTierView(view: RollingOptOutTierView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
