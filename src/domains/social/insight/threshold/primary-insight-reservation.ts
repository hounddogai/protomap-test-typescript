import * as text from "../../../../kit/text.js";

/** Where a primary insight reservation is in its life cycle. */
export type PrimaryInsightReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary insight reservation and its current status. */
export class PrimaryInsightReservation {
  code: string;
  name: string;
  notes: string;
  timezone: string;
  campaignRef: string;
  limit: number;
  impressions: number;
  retries: number;
  title: string;
  version: number;
  clicks: number;
  status: PrimaryInsightReservationStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    timezone: string,
    campaignRef: string,
    limit: number,
    impressions: number,
    retries: number,
    title: string,
    version: number,
    clicks: number,
    status: PrimaryInsightReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.timezone = timezone;
    this.campaignRef = campaignRef;
    this.limit = limit;
    this.impressions = impressions;
    this.retries = retries;
    this.title = title;
    this.version = version;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryInsightReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryInsightReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary insight reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"primary insight reservation"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.limit * this.clicks * 100) / 100;
  }

  copy(): PrimaryInsightReservation {
    return new PrimaryInsightReservation(
      this.code,
      this.name,
      this.notes,
      this.timezone,
      this.campaignRef,
      this.limit,
      this.impressions,
      this.retries,
      this.title,
      this.version,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary insight reservation in status new. */
export function newPrimaryInsightReservation(code: string, name: string): PrimaryInsightReservation {
  return new PrimaryInsightReservation(code, name, "", "", "", 0, 0, 0, "", 0, 0, "new");
}
