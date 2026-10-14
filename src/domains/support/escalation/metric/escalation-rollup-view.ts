import * as text from "../../../../kit/text.js";
import { EscalationRollup } from "./escalation-rollup.js";

/** How screens and exports show a escalation rollup. */
export class EscalationRollupView {
  codeText: string;
  name: string;
  openRate: string;
  visible: string;
  summaryText: string;
  contactEmail: string;
  durationMinutes: string;
  descriptionText: string;
  clicks: string;
  cohort: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    openRate: string,
    visible: string,
    summaryText: string,
    contactEmail: string,
    durationMinutes: string,
    descriptionText: string,
    clicks: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.openRate = openRate;
    this.visible = visible;
    this.summaryText = summaryText;
    this.contactEmail = contactEmail;
    this.durationMinutes = durationMinutes;
    this.descriptionText = descriptionText;
    this.clicks = clicks;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationRollupView(item: EscalationRollup): EscalationRollupView {
  return new EscalationRollupView(
    item.code,
    text.truncate(item.name, 120),
    item.openRate.toFixed(2),
    `${item.visible}`,
    item.summary,
    item.contactEmail,
    String(item.durationMinutes),
    item.description,
    String(item.clicks),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationRollupViews(items: EscalationRollup[]): EscalationRollupView[] {
  const views: EscalationRollupView[] = [];
  for (const item of items) {
    views.push(toEscalationRollupView(item));
  }
  return views;
}

export function sumEscalationRollupView(view: EscalationRollupView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedOpenRate + parsedDurationMinutes + parsedClicks;
}
