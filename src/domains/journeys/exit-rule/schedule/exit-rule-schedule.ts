/**
 * The exit rule schedule records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule schedule is in its life cycle. */
export type ExitRuleScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One exit rule schedule, with what the planners need to act on it. */
export class ExitRuleSchedule {
  code: string;
  label: string;
  endsAt: number;
  priority: number;
  attempts: number;
  source: string;
  pinned: boolean;
  notes: string;
  minimum: number;
  threshold: number;
  status: ExitRuleScheduleStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    priority: number,
    attempts: number,
    source: string,
    pinned: boolean,
    notes: string,
    minimum: number,
    threshold: number,
    status: ExitRuleScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.priority = priority;
    this.attempts = attempts;
    this.source = source;
    this.pinned = pinned;
    this.notes = notes;
    this.minimum = minimum;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ExitRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"exit rule schedule"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.endsAt + this.priority) * 100) / 100;
  }

  copy(): ExitRuleSchedule {
    return new ExitRuleSchedule(
      this.code,
      this.label,
      this.endsAt,
      this.priority,
      this.attempts,
      this.source,
      this.pinned,
      this.notes,
      this.minimum,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a exit rule schedule in status open. */
export function newExitRuleSchedule(code: string, label: string): ExitRuleSchedule {
  return new ExitRuleSchedule(code, label, 0, 0, 0, "", false, "", 0, 0, "open");
}
