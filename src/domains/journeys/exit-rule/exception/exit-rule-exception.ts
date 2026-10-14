/**
 * The exit rule exception records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule exception is in its life cycle. */
export type ExitRuleExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One exit rule exception, with what the planners need to act on it. */
export class ExitRuleException {
  code: string;
  name: string;
  weight: number;
  ceiling: number;
  bid: number;
  batchSize: number;
  status: ExitRuleExceptionStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    ceiling: number,
    bid: number,
    batchSize: number,
    status: ExitRuleExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.ceiling = ceiling;
    this.bid = bid;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.batchSize + this.weight) * 100) / 100;
  }

  copy(): ExitRuleException {
    return new ExitRuleException(
      this.code,
      this.name,
      this.weight,
      this.ceiling,
      this.bid,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a exit rule exception in status idle. */
export function newExitRuleException(code: string, name: string): ExitRuleException {
  return new ExitRuleException(code, name, 0, 0, 0, 0, "idle");
}
