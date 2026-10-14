import { RetentionPlan } from "./retention-plan.js";

/** How screens and exports show a retention plan. */
export class RetentionPlanView {
  code: string;
  title: string;
  conversionRateText: string;
  timezone: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    conversionRateText: string,
    timezone: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRateText = conversionRateText;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionPlanView(item: RetentionPlan): RetentionPlanView {
  return new RetentionPlanView(
    item.code,
    item.title,
    item.conversionRate.toFixed(2),
    item.timezone,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionPlanViews(items: RetentionPlan[]): RetentionPlanView[] {
  const views: RetentionPlanView[] = [];
  for (const item of items) {
    views.push(toRetentionPlanView(item));
  }
  return views;
}

export function sumRetentionPlanView(view: RetentionPlanView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedConversionRate + parsedStartsAt;
}
