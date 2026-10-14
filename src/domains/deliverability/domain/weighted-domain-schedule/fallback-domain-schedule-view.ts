import { FallbackDomainSchedule } from "./fallback-domain-schedule.js";

/** How screens and exports show a fallback domain schedule. */
export class FallbackDomainScheduleView {
  code: string;
  label: string;
  ownerId: string;
  limitText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    limitText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.limitText = limitText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackDomainScheduleView(item: FallbackDomainSchedule): FallbackDomainScheduleView {
  return new FallbackDomainScheduleView(
    item.code,
    item.label,
    item.ownerId,
    String(item.limit),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackDomainScheduleViews(items: FallbackDomainSchedule[]): FallbackDomainScheduleView[] {
  const views: FallbackDomainScheduleView[] = [];
  for (const item of items) {
    views.push(toFallbackDomainScheduleView(item));
  }
  return views;
}

export function sumFallbackDomainScheduleView(view: FallbackDomainScheduleView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedLimit + parsedWeight;
}
