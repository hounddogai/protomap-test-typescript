import * as text from "../../../../kit/text.js";
import { ManualFunnelSchedule } from "./manual-funnel-schedule.js";

/** How screens and exports show a manual funnel schedule. */
export class ManualFunnelScheduleView {
  codeText: string;
  label: string;
  campaignRefText: string;
  capacity: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    campaignRefText: string,
    capacity: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.campaignRefText = campaignRefText;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toManualFunnelScheduleView(item: ManualFunnelSchedule): ManualFunnelScheduleView {
  return new ManualFunnelScheduleView(
    text.truncate(item.code, 64),
    item.label,
    item.campaignRef,
    String(item.capacity),
    text.truncate(item.journeyId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualFunnelScheduleViews(items: ManualFunnelSchedule[]): ManualFunnelScheduleView[] {
  const views: ManualFunnelScheduleView[] = [];
  for (const item of items) {
    views.push(toManualFunnelScheduleView(item));
  }
  return views;
}

export function sumManualFunnelScheduleView(view: ManualFunnelScheduleView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCapacity;
}
