import * as text from "../../../../kit/text.js";
import { TieredRewardRuleReservation } from "./tiered-reward-rule-reservation.js";

/** How screens and exports show a tiered reward rule reservation. */
export class TieredRewardRuleReservationView {
  code: string;
  name: string;
  sequence: string;
  durationMinutes: string;
  contactEmail: string;
  labelText: string;
  audienceId: string;
  unitText: string;
  cohort: string;
  timezoneText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sequence: string,
    durationMinutes: string,
    contactEmail: string,
    labelText: string,
    audienceId: string,
    unitText: string,
    cohort: string,
    timezoneText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.labelText = labelText;
    this.audienceId = audienceId;
    this.unitText = unitText;
    this.cohort = cohort;
    this.timezoneText = timezoneText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardRuleReservationView(item: TieredRewardRuleReservation): TieredRewardRuleReservationView {
  return new TieredRewardRuleReservationView(
    item.code,
    item.name,
    String(item.sequence),
    String(item.durationMinutes),
    text.truncate(item.contactEmail, 80),
    item.label,
    item.audienceId,
    item.unit,
    text.truncate(item.cohort, 40),
    item.timezone,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardRuleReservationViews(items: TieredRewardRuleReservation[]): TieredRewardRuleReservationView[] {
  const views: TieredRewardRuleReservationView[] = [];
  for (const item of items) {
    views.push(toTieredRewardRuleReservationView(item));
  }
  return views;
}

export function sumTieredRewardRuleReservationView(view: TieredRewardRuleReservationView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedSequence + parsedDurationMinutes + parsedThreshold;
}
