/**
 * The manual complaint target records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual complaint target is in its life cycle. */
export type ManualComplaintTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual complaint target as the complaint team keeps it. */
export class ManualComplaintTarget {
  code: string;
  name: string;
  windowDays: number;
  locale: string;
  journeyId: string;
  status: ManualComplaintTargetStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    locale: string,
    journeyId: string,
    status: ManualComplaintTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.locale = locale;
    this.journeyId = journeyId;
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

  canMoveTo(next: ManualComplaintTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualComplaintTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual complaint target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): ManualComplaintTarget {
    return new ManualComplaintTarget(this.code, this.name, this.windowDays, this.locale, this.journeyId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual complaint target in status planned. */
export function newManualComplaintTarget(code: string, name: string): ManualComplaintTarget {
  return new ManualComplaintTarget(code, name, 0, "", "", "planned");
}
