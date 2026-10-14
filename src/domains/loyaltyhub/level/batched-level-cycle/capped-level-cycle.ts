/**
 * The capped level cycle records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped level cycle is in its life cycle. */
export type CappedLevelCycleStatus = "created" | "validated" | "published" | "retired";

/** One capped level cycle, with what the planners need to act on it. */
export class CappedLevelCycle {
  code: string;
  label: string;
  maximum: number;
  locale: string;
  quantity: number;
  status: CappedLevelCycleStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    locale: string,
    quantity: number,
    status: CappedLevelCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.locale = locale;
    this.quantity = quantity;
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

  canMoveTo(next: CappedLevelCycleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedLevelCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped level cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped level cycle"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.quantity + this.maximum) * 100) / 100;
  }

  copy(): CappedLevelCycle {
    return new CappedLevelCycle(this.code, this.label, this.maximum, this.locale, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped level cycle in status created. */
export function newCappedLevelCycle(code: string, label: string): CappedLevelCycle {
  return new CappedLevelCycle(code, label, 0, "", 0, "created");
}
