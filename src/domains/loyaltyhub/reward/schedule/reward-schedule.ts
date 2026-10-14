/**
 * The reward schedule records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward schedule is in its life cycle. */
export type RewardScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a reward schedule and its current status. */
export class RewardSchedule {
  code: string;
  title: string;
  priority: number;
  retries: number;
  variant: string;
  status: RewardScheduleStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    retries: number,
    variant: string,
    status: RewardScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.retries = retries;
    this.variant = variant;
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

  canMoveTo(next: RewardScheduleStatus): boolean {
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
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RewardScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward schedule"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.priority - this.retries) * 100) / 100;
  }

  copy(): RewardSchedule {
    return new RewardSchedule(this.code, this.title, this.priority, this.retries, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward schedule in status open. */
export function newRewardSchedule(code: string, title: string): RewardSchedule {
  return new RewardSchedule(code, title, 0, 0, "", "open");
}
