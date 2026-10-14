import * as text from "../../../../kit/text.js";
import { EscalationProfile } from "./escalation-profile.js";

/** How screens and exports show a escalation profile. */
export class EscalationProfileView {
  codeText: string;
  title: string;
  cost: string;
  region: string;
  durationMinutes: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    cost: string,
    region: string,
    durationMinutes: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.cost = cost;
    this.region = region;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationProfileView(item: EscalationProfile): EscalationProfileView {
  return new EscalationProfileView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 120),
    item.cost.toFixed(2),
    item.region,
    String(item.durationMinutes),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationProfileViews(items: EscalationProfile[]): EscalationProfileView[] {
  const views: EscalationProfileView[] = [];
  for (const item of items) {
    views.push(toEscalationProfileView(item));
  }
  return views;
}

export function sumEscalationProfileView(view: EscalationProfileView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCost + parsedDurationMinutes + parsedEndsAt;
}
