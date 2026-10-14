import { LegacyFunnelSchedule } from "./legacy-funnel-schedule.js";

/** How screens and exports show a legacy funnel schedule. */
export class LegacyFunnelScheduleView {
  code: string;
  title: string;
  batchSize: string;
  nameText: string;
  clicks: string;
  priority: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSize: string,
    nameText: string,
    clicks: string,
    priority: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.nameText = nameText;
    this.clicks = clicks;
    this.priority = priority;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyFunnelScheduleView(item: LegacyFunnelSchedule): LegacyFunnelScheduleView {
  return new LegacyFunnelScheduleView(
    item.code,
    item.title,
    String(item.batchSize),
    item.name,
    String(item.clicks),
    String(item.priority),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyFunnelScheduleViews(items: LegacyFunnelSchedule[]): LegacyFunnelScheduleView[] {
  const views: LegacyFunnelScheduleView[] = [];
  for (const item of items) {
    views.push(toLegacyFunnelScheduleView(item));
  }
  return views;
}

export function sumLegacyFunnelScheduleView(view: LegacyFunnelScheduleView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBatchSize + parsedClicks + parsedPriority;
}
