/**
 * The double opt in milestone records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in milestone is in its life cycle. */
export type DoubleOptInMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One double opt in milestone, with what the planners need to act on it. */
export class DoubleOptInMilestone {
  code: string;
  name: string;
  checksum: string;
  attempts: number;
  batchSize: number;
  margin: number;
  status: DoubleOptInMilestoneStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    attempts: number,
    batchSize: number,
    margin: number,
    status: DoubleOptInMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.attempts = attempts;
    this.batchSize = batchSize;
    this.margin = margin;
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

  canMoveTo(next: DoubleOptInMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round(this.margin * this.attempts * 100) / 100;
  }

  copy(): DoubleOptInMilestone {
    return new DoubleOptInMilestone(
      this.code,
      this.name,
      this.checksum,
      this.attempts,
      this.batchSize,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a double opt in milestone in status idle. */
export function newDoubleOptInMilestone(code: string, name: string): DoubleOptInMilestone {
  return new DoubleOptInMilestone(code, name, "", 0, 0, 0, "idle");
}
