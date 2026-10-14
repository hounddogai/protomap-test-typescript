import { PendingActivationSchedule } from "./pending-activation-schedule.js";

/** How screens and exports show a pending activation schedule. */
export class PendingActivationScheduleView {
  codeText: string;
  labelText: string;
  region: string;
  amount: string;
  sendAt: string;
  timezone: string;
  conversionRate: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    region: string,
    amount: string,
    sendAt: string,
    timezone: string,
    conversionRate: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.region = region;
    this.amount = amount;
    this.sendAt = sendAt;
    this.timezone = timezone;
    this.conversionRate = conversionRate;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toPendingActivationScheduleView(item: PendingActivationSchedule): PendingActivationScheduleView {
  return new PendingActivationScheduleView(
    item.code,
    item.label,
    item.region,
    item.amount.toFixed(2),
    String(item.sendAt),
    item.timezone,
    item.conversionRate.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingActivationScheduleViews(items: PendingActivationSchedule[]): PendingActivationScheduleView[] {
  const views: PendingActivationScheduleView[] = [];
  for (const item of items) {
    views.push(toPendingActivationScheduleView(item));
  }
  return views;
}

export function sumPendingActivationScheduleView(view: PendingActivationScheduleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedAmount + parsedSendAt + parsedConversionRate;
}
