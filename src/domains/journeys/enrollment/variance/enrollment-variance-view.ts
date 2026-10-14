import * as text from "../../../../kit/text.js";
import { EnrollmentVariance } from "./enrollment-variance.js";

/** How screens and exports show a enrollment variance. */
export class EnrollmentVarianceView {
  code: string;
  name: string;
  attempts: string;
  frequencyCap: string;
  sendAt: string;
  endsAt: string;
  unit: string;
  archivedText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    attempts: string,
    frequencyCap: string,
    sendAt: string,
    endsAt: string,
    unit: string,
    archivedText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.unit = unit;
    this.archivedText = archivedText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentVarianceView(item: EnrollmentVariance): EnrollmentVarianceView {
  return new EnrollmentVarianceView(
    text.truncate(item.code, 80),
    item.name,
    String(item.attempts),
    String(item.frequencyCap),
    String(item.sendAt),
    String(item.endsAt),
    item.unit,
    `${item.archived}`,
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentVarianceViews(items: EnrollmentVariance[]): EnrollmentVarianceView[] {
  const views: EnrollmentVarianceView[] = [];
  for (const item of items) {
    views.push(toEnrollmentVarianceView(item));
  }
  return views;
}

export function sumEnrollmentVarianceView(view: EnrollmentVarianceView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedAttempts + parsedFrequencyCap + parsedSendAt;
}
