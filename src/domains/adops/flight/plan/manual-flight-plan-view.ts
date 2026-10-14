import * as text from "../../../../kit/text.js";
import { ManualFlightPlan } from "./manual-flight-plan.js";

/** How screens and exports show a manual flight plan. */
export class ManualFlightPlanView {
  code: string;
  name: string;
  attemptsText: string;
  segmentText: string;
  openRateText: string;
  startsAt: string;
  externalRefText: string;
  timezone: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attemptsText: string,
    segmentText: string,
    openRateText: string,
    startsAt: string,
    externalRefText: string,
    timezone: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attemptsText = attemptsText;
    this.segmentText = segmentText;
    this.openRateText = openRateText;
    this.startsAt = startsAt;
    this.externalRefText = externalRefText;
    this.timezone = timezone;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toManualFlightPlanView(item: ManualFlightPlan): ManualFlightPlanView {
  return new ManualFlightPlanView(
    text.truncate(item.code, 80),
    item.name,
    String(item.attempts),
    item.segment,
    item.openRate.toFixed(2),
    String(item.startsAt),
    item.externalRef,
    item.timezone,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualFlightPlanViews(items: ManualFlightPlan[]): ManualFlightPlanView[] {
  const views: ManualFlightPlanView[] = [];
  for (const item of items) {
    views.push(toManualFlightPlanView(item));
  }
  return views;
}

export function sumManualFlightPlanView(view: ManualFlightPlanView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedAttempts + parsedOpenRate + parsedStartsAt;
}
