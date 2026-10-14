/**
 * The manual streak exception records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual streak exception is in its life cycle. */
export type ManualStreakExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual streak exception, with what the planners need to act on it. */
export class ManualStreakException {
  code: string;
  name: string;
  ratio: number;
  visible: boolean;
  durationMinutes: number;
  conversionRate: number;
  cost: number;
  active: boolean;
  status: ManualStreakExceptionStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    visible: boolean,
    durationMinutes: number,
    conversionRate: number,
    cost: number,
    active: boolean,
    status: ManualStreakExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.visible = visible;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.cost = cost;
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

  canMoveTo(next: ManualStreakExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualStreakExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual streak exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round((this.ratio - this.conversionRate) * 100) / 100;
  }

  copy(): ManualStreakException {
    return new ManualStreakException(
      this.code,
      this.name,
      this.ratio,
      this.visible,
      this.durationMinutes,
      this.conversionRate,
      this.cost,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual streak exception in status open. */
export function newManualStreakException(code: string, name: string): ManualStreakException {
  return new ManualStreakException(code, name, 0, false, 0, 0, 0, false, "open");
}
