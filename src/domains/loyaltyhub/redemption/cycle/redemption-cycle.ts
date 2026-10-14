/**
 * The redemption cycle records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption cycle is in its life cycle. */
export type RedemptionCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One redemption cycle, with what the planners need to act on it. */
export class RedemptionCycle {
  code: string;
  name: string;
  priority: number;
  archived: boolean;
  channel: string;
  margin: number;
  score: number;
  status: RedemptionCycleStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    archived: boolean,
    channel: string,
    margin: number,
    score: number,
    status: RedemptionCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.archived = archived;
    this.channel = channel;
    this.margin = margin;
    this.score = score;
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

  canMoveTo(next: RedemptionCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"redemption cycle"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.margin - this.priority) * 100) / 100;
  }

  copy(): RedemptionCycle {
    return new RedemptionCycle(
      this.code,
      this.name,
      this.priority,
      this.archived,
      this.channel,
      this.margin,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a redemption cycle in status planned. */
export function newRedemptionCycle(code: string, name: string): RedemptionCycle {
  return new RedemptionCycle(code, name, 0, false, "", 0, 0, "planned");
}
