import { ManualOptOutProfile } from "./manual-opt-out-profile.js";

/** How screens and exports show a manual opt out profile. */
export class ManualOptOutProfileView {
  code: string;
  name: string;
  endsAt: string;
  contactEmailText: string;
  graceDays: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    endsAt: string,
    contactEmailText: string,
    graceDays: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.contactEmailText = contactEmailText;
    this.graceDays = graceDays;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toManualOptOutProfileView(item: ManualOptOutProfile): ManualOptOutProfileView {
  return new ManualOptOutProfileView(
    item.code,
    item.name,
    String(item.endsAt),
    item.contactEmail,
    String(item.graceDays),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualOptOutProfileViews(items: ManualOptOutProfile[]): ManualOptOutProfileView[] {
  const views: ManualOptOutProfileView[] = [];
  for (const item of items) {
    views.push(toManualOptOutProfileView(item));
  }
  return views;
}

export function sumManualOptOutProfileView(view: ManualOptOutProfileView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedEndsAt + parsedGraceDays;
}
