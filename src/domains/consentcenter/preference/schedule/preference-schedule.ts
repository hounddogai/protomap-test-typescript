/**
 * The preference schedule records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference schedule is in its life cycle. */
export type PreferenceScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One preference schedule, with what the planners need to act on it. */
export class PreferenceSchedule {
  code: string;
  title: string;
  updatedAt: number;
  limit: number;
  notes: string;
  active: boolean;
  locale: string;
  openRate: number;
  cohort: string;
  discount: number;
  status: PreferenceScheduleStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    limit: number,
    notes: string,
    active: boolean,
    locale: string,
    openRate: number,
    cohort: string,
    discount: number,
    status: PreferenceScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.limit = limit;
    this.notes = notes;
    this.active = active;
    this.locale = locale;
    this.openRate = openRate;
    this.cohort = cohort;
    this.discount = discount;
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

  canMoveTo(next: PreferenceScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PreferenceScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round(this.updatedAt * this.limit * 100) / 100;
  }

  copy(): PreferenceSchedule {
    return new PreferenceSchedule(
      this.code,
      this.title,
      this.updatedAt,
      this.limit,
      this.notes,
      this.active,
      this.locale,
      this.openRate,
      this.cohort,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a preference schedule in status planned. */
export function newPreferenceSchedule(code: string, title: string): PreferenceSchedule {
  return new PreferenceSchedule(code, title, 0, 0, "", false, "", 0, "", 0, "planned");
}
