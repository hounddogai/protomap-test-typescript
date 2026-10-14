/**
 * The adaptive domain schedule records of deliverability's domain work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive domain schedule is in its life cycle. */
export type AdaptiveDomainScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One adaptive domain schedule, with what the planners need to act on it. */
export class AdaptiveDomainSchedule {
  code: string;
  label: string;
  channel: string;
  approved: boolean;
  notes: string;
  utmSource: string;
  timezone: string;
  score: number;
  status: AdaptiveDomainScheduleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    approved: boolean,
    notes: string,
    utmSource: string,
    timezone: string,
    score: number,
    status: AdaptiveDomainScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.approved = approved;
    this.notes = notes;
    this.utmSource = utmSource;
    this.timezone = timezone;
    this.score = score;
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

  canMoveTo(next: AdaptiveDomainScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveDomainScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive domain schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): AdaptiveDomainSchedule {
    return new AdaptiveDomainSchedule(
      this.code,
      this.label,
      this.channel,
      this.approved,
      this.notes,
      this.utmSource,
      this.timezone,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive domain schedule in status planned. */
export function newAdaptiveDomainSchedule(code: string, label: string): AdaptiveDomainSchedule {
  return new AdaptiveDomainSchedule(code, label, "", false, "", "", "", 0, "planned");
}
