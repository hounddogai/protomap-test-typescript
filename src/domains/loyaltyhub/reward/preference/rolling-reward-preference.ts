/**
 * The rolling reward preference records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling reward preference is in its life cycle. */
export type RollingRewardPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling reward preference as the reward team keeps it. */
export class RollingRewardPreference {
  code: string;
  label: string;
  timezone: string;
  segment: string;
  amount: number;
  status: RollingRewardPreferenceStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    segment: string,
    amount: number,
    status: RollingRewardPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.segment = segment;
    this.amount = amount;
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

  canMoveTo(next: RollingRewardPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingRewardPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reward preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): RollingRewardPreference {
    return new RollingRewardPreference(this.code, this.label, this.timezone, this.segment, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling reward preference in status new. */
export function newRollingRewardPreference(code: string, label: string): RollingRewardPreference {
  return new RollingRewardPreference(code, label, "", "", 0, "new");
}
