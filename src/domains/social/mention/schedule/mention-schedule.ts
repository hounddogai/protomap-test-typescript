/**
 * The mention schedule records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention schedule is in its life cycle. */
export type MentionScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One mention schedule, with what the planners need to act on it. */
export class MentionSchedule {
  code: string;
  name: string;
  updatedAt: number;
  active: boolean;
  cohort: string;
  budget: number;
  summary: string;
  bid: number;
  sequence: number;
  status: MentionScheduleStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    active: boolean,
    cohort: string,
    budget: number,
    summary: string,
    bid: number,
    sequence: number,
    status: MentionScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.active = active;
    this.cohort = cohort;
    this.budget = budget;
    this.summary = summary;
    this.bid = bid;
    this.sequence = sequence;
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

  canMoveTo(next: MentionScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: MentionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.updatedAt * this.bid * 100) / 100;
  }

  copy(): MentionSchedule {
    return new MentionSchedule(
      this.code,
      this.name,
      this.updatedAt,
      this.active,
      this.cohort,
      this.budget,
      this.summary,
      this.bid,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a mention schedule in status idle. */
export function newMentionSchedule(code: string, name: string): MentionSchedule {
  return new MentionSchedule(code, name, 0, false, "", 0, "", 0, 0, "idle");
}
