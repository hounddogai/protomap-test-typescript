import { PreferenceGroup } from "./preference-group.js";

/** How screens and exports show a preference group. */
export class PreferenceGroupView {
  code: string;
  title: string;
  sendAtText: string;
  discount: string;
  reviewer: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sendAtText: string,
    discount: string,
    reviewer: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sendAtText = sendAtText;
    this.discount = discount;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceGroupView(item: PreferenceGroup): PreferenceGroupView {
  return new PreferenceGroupView(
    item.code,
    item.title,
    String(item.sendAt),
    item.discount.toFixed(2),
    item.reviewer,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceGroupViews(items: PreferenceGroup[]): PreferenceGroupView[] {
  const views: PreferenceGroupView[] = [];
  for (const item of items) {
    views.push(toPreferenceGroupView(item));
  }
  return views;
}

export function sumPreferenceGroupView(view: PreferenceGroupView): number {
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedSendAt + parsedDiscount;
}
