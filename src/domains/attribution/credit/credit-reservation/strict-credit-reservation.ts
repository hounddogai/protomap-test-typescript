/**
 * The strict credit reservation records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict credit reservation is in its life cycle. */
export type StrictCreditReservationStatus = "created" | "validated" | "published" | "retired";

/** One strict credit reservation, with what the planners need to act on it. */
export class StrictCreditReservation {
  code: string;
  label: string;
  windowDays: number;
  locale: string;
  name: string;
  updatedAt: number;
  reviewer: string;
  approved: boolean;
  status: StrictCreditReservationStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    locale: string,
    name: string,
    updatedAt: number,
    reviewer: string,
    approved: boolean,
    status: StrictCreditReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.locale = locale;
    this.name = name;
    this.updatedAt = updatedAt;
    this.reviewer = reviewer;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictCreditReservationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictCreditReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict credit reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict credit reservation"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.updatedAt - this.windowDays) * 100) / 100;
  }

  copy(): StrictCreditReservation {
    return new StrictCreditReservation(
      this.code,
      this.label,
      this.windowDays,
      this.locale,
      this.name,
      this.updatedAt,
      this.reviewer,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict credit reservation in status created. */
export function newStrictCreditReservation(code: string, label: string): StrictCreditReservation {
  return new StrictCreditReservation(code, label, 0, "", "", 0, "", false, "created");
}
