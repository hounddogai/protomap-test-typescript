import { LegacyInviteAdjustment } from "./legacy-invite-adjustment.js";

/** How screens and exports show a legacy invite adjustment. */
export class LegacyInviteAdjustmentView {
  code: string;
  name: string;
  minimum: string;
  cohort: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    minimum: string,
    cohort: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyInviteAdjustmentView(item: LegacyInviteAdjustment): LegacyInviteAdjustmentView {
  return new LegacyInviteAdjustmentView(
    item.code,
    item.name,
    item.minimum.toFixed(2),
    item.cohort,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyInviteAdjustmentViews(items: LegacyInviteAdjustment[]): LegacyInviteAdjustmentView[] {
  const views: LegacyInviteAdjustmentView[] = [];
  for (const item of items) {
    views.push(toLegacyInviteAdjustmentView(item));
  }
  return views;
}

export function sumLegacyInviteAdjustmentView(view: LegacyInviteAdjustmentView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedMinimum;
}
