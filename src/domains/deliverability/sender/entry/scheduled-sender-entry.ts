/**
 * The scheduled sender entry records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled sender entry is in its life cycle. */
export type ScheduledSenderEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled sender entry as the sender team keeps it. */
export class ScheduledSenderEntry {
  code: string;
  title: string;
  journeyId: string;
  batchSize: number;
  locale: string;
  name: string;
  impressions: number;
  rate: number;
  timezone: string;
  country: string;
  status: ScheduledSenderEntryStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    batchSize: number,
    locale: string,
    name: string,
    impressions: number,
    rate: number,
    timezone: string,
    country: string,
    status: ScheduledSenderEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.batchSize = batchSize;
    this.locale = locale;
    this.name = name;
    this.impressions = impressions;
    this.rate = rate;
    this.timezone = timezone;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledSenderEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledSenderEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sender entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled sender entry"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.impressions - this.batchSize) * 100) / 100;
  }

  copy(): ScheduledSenderEntry {
    return new ScheduledSenderEntry(
      this.code,
      this.title,
      this.journeyId,
      this.batchSize,
      this.locale,
      this.name,
      this.impressions,
      this.rate,
      this.timezone,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled sender entry in status planned. */
export function newScheduledSenderEntry(code: string, title: string): ScheduledSenderEntry {
  return new ScheduledSenderEntry(code, title, "", 0, "", "", 0, 0, "", "", "planned");
}
