/**
 * The scheduled nudge preference records of growth's nudge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled nudge preference is in its life cycle. */
export type ScheduledNudgePreferenceStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled nudge preference and its current status. */
export class ScheduledNudgePreference {
  code: string;
  label: string;
  weight: number;
  amount: number;
  summary: string;
  status: ScheduledNudgePreferenceStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    amount: number,
    summary: string,
    status: ScheduledNudgePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.amount = amount;
    this.summary = summary;
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

  canMoveTo(next: ScheduledNudgePreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledNudgePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled nudge preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.amount - this.weight) * 100) / 100;
  }

  copy(): ScheduledNudgePreference {
    return new ScheduledNudgePreference(this.code, this.label, this.weight, this.amount, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled nudge preference in status created. */
export function newScheduledNudgePreference(code: string, label: string): ScheduledNudgePreference {
  return new ScheduledNudgePreference(code, label, 0, 0, "", "created");
}
