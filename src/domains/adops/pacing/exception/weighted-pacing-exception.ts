/**
 * The weighted pacing exception records of adops's pacing work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted pacing exception is in its life cycle. */
export type WeightedPacingExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted pacing exception as the pacing team keeps it. */
export class WeightedPacingException {
  code: string;
  name: string;
  attempts: number;
  visible: boolean;
  cost: number;
  status: WeightedPacingExceptionStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    visible: boolean,
    cost: number,
    status: WeightedPacingExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.visible = visible;
    this.cost = cost;
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

  canMoveTo(next: WeightedPacingExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedPacingExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted pacing exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round((this.attempts + this.cost) * 100) / 100;
  }

  copy(): WeightedPacingException {
    return new WeightedPacingException(this.code, this.name, this.attempts, this.visible, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted pacing exception in status idle. */
export function newWeightedPacingException(code: string, name: string): WeightedPacingException {
  return new WeightedPacingException(code, name, 0, false, 0, "idle");
}
