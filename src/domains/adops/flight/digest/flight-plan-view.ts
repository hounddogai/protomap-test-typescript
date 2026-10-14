import { FlightPlan } from "./flight-plan.js";

/** How screens and exports show a flight plan. */
export class FlightPlanView {
  codeText: string;
  title: string;
  ratio: string;
  durationMinutesText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ratio: string,
    durationMinutesText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ratio = ratio;
    this.durationMinutesText = durationMinutesText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toFlightPlanView(item: FlightPlan): FlightPlanView {
  return new FlightPlanView(
    item.code,
    item.title,
    item.ratio.toFixed(2),
    String(item.durationMinutes),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightPlanViews(items: FlightPlan[]): FlightPlanView[] {
  const views: FlightPlanView[] = [];
  for (const item of items) {
    views.push(toFlightPlanView(item));
  }
  return views;
}

export function sumFlightPlanView(view: FlightPlanView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedRatio + parsedDurationMinutes + parsedWindowDays;
}
