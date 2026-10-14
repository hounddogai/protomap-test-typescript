import { PrimaryFraudCheckDigest } from "./primary-fraud-check-digest.js";

/** How screens and exports show a primary fraud check digest. */
export class PrimaryFraudCheckDigestView {
  code: string;
  name: string;
  graceDays: string;
  durationMinutes: string;
  startsAt: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDays: string,
    durationMinutes: string,
    startsAt: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.durationMinutes = durationMinutes;
    this.startsAt = startsAt;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFraudCheckDigestView(item: PrimaryFraudCheckDigest): PrimaryFraudCheckDigestView {
  return new PrimaryFraudCheckDigestView(
    item.code,
    item.name,
    String(item.graceDays),
    String(item.durationMinutes),
    String(item.startsAt),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFraudCheckDigestViews(items: PrimaryFraudCheckDigest[]): PrimaryFraudCheckDigestView[] {
  const views: PrimaryFraudCheckDigestView[] = [];
  for (const item of items) {
    views.push(toPrimaryFraudCheckDigestView(item));
  }
  return views;
}

export function sumPrimaryFraudCheckDigestView(view: PrimaryFraudCheckDigestView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedGraceDays + parsedDurationMinutes + parsedStartsAt;
}
