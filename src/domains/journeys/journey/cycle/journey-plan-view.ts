import { JourneyPlan } from "./journey-plan.js";

/** How screens and exports show a journey plan. */
export class JourneyPlanView {
  code: string;
  title: string;
  windowDays: string;
  clicks: string;
  updatedAt: string;
  revisionText: string;
  unitText: string;
  version: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    clicks: string,
    updatedAt: string,
    revisionText: string,
    unitText: string,
    version: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.clicks = clicks;
    this.updatedAt = updatedAt;
    this.revisionText = revisionText;
    this.unitText = unitText;
    this.version = version;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyPlanView(item: JourneyPlan): JourneyPlanView {
  return new JourneyPlanView(
    item.code,
    item.title,
    String(item.windowDays),
    String(item.clicks),
    String(item.updatedAt),
    String(item.revision),
    item.unit,
    String(item.version),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyPlanViews(items: JourneyPlan[]): JourneyPlanView[] {
  const views: JourneyPlanView[] = [];
  for (const item of items) {
    views.push(toJourneyPlanView(item));
  }
  return views;
}

export function sumJourneyPlanView(view: JourneyPlanView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedWindowDays + parsedClicks + parsedUpdatedAt;
}
