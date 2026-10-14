import { InviteProfile } from "./invite-profile.js";

/** How screens and exports show a invite profile. */
export class InviteProfileView {
  code: string;
  titleText: string;
  label: string;
  channel: string;
  localeText: string;
  durationMinutes: string;
  rate: string;
  discount: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    label: string,
    channel: string,
    localeText: string,
    durationMinutes: string,
    rate: string,
    discount: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.label = label;
    this.channel = channel;
    this.localeText = localeText;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.discount = discount;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toInviteProfileView(item: InviteProfile): InviteProfileView {
  return new InviteProfileView(
    item.code,
    item.title,
    item.label,
    item.channel,
    item.locale,
    String(item.durationMinutes),
    item.rate.toFixed(2),
    item.discount.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteProfileViews(items: InviteProfile[]): InviteProfileView[] {
  const views: InviteProfileView[] = [];
  for (const item of items) {
    views.push(toInviteProfileView(item));
  }
  return views;
}

export function sumInviteProfileView(view: InviteProfileView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDurationMinutes + parsedRate + parsedDiscount;
}
