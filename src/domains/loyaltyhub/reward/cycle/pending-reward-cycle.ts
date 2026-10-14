/**
 * The pending reward cycle records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending reward cycle is in its life cycle. */
export type PendingRewardCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One pending reward cycle, with what the planners need to act on it. */
export class PendingRewardCycle {
  code: string;
  label: string;
  notes: string;
  region: string;
  threshold: number;
  limit: number;
  status: PendingRewardCycleStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    region: string,
    threshold: number,
    limit: number,
    status: PendingRewardCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.region = region;
    this.threshold = threshold;
    this.limit = limit;
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

  canMoveTo(next: PendingRewardCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingRewardCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.limit * this.threshold * 100) / 100;
  }

  copy(): PendingRewardCycle {
    return new PendingRewardCycle(
      this.code,
      this.label,
      this.notes,
      this.region,
      this.threshold,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pending reward cycle in status planned. */
export function newPendingRewardCycle(code: string, label: string): PendingRewardCycle {
  return new PendingRewardCycle(code, label, "", "", 0, 0, "planned");
}
