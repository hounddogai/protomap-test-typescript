/**
 * The pending retention budget records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending retention budget is in its life cycle. */
export type PendingRetentionBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One pending retention budget, with what the planners need to act on it. */
export class PendingRetentionBudget {
  code: string;
  label: string;
  timezone: string;
  attempts: number;
  capacity: number;
  region: string;
  active: boolean;
  status: PendingRetentionBudgetStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    attempts: number,
    capacity: number,
    region: string,
    active: boolean,
    status: PendingRetentionBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.attempts = attempts;
    this.capacity = capacity;
    this.region = region;
    this.active = active;
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

  canMoveTo(next: PendingRetentionBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRetentionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending retention budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.attempts + this.capacity) * 100) / 100;
  }

  copy(): PendingRetentionBudget {
    return new PendingRetentionBudget(
      this.code,
      this.label,
      this.timezone,
      this.attempts,
      this.capacity,
      this.region,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pending retention budget in status open. */
export function newPendingRetentionBudget(code: string, label: string): PendingRetentionBudget {
  return new PendingRetentionBudget(code, label, "", 0, 0, "", false, "open");
}
