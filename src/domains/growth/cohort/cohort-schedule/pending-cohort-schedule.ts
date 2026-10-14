/**
 * The pending cohort schedule records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending cohort schedule is in its life cycle. */
export type PendingCohortScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending cohort schedule. Its code is unique within a tenant. */
export class PendingCohortSchedule {
  code: string;
  label: string;
  margin: number;
  createdAt: number;
  bid: number;
  limit: number;
  journeyId: string;
  status: PendingCohortScheduleStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    createdAt: number,
    bid: number,
    limit: number,
    journeyId: string,
    status: PendingCohortScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.createdAt = createdAt;
    this.bid = bid;
    this.limit = limit;
    this.journeyId = journeyId;
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

  canMoveTo(next: PendingCohortScheduleStatus): boolean {
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCohortScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending cohort schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round(this.margin * this.bid * 100) / 100;
  }

  copy(): PendingCohortSchedule {
    return new PendingCohortSchedule(
      this.code,
      this.label,
      this.margin,
      this.createdAt,
      this.bid,
      this.limit,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending cohort schedule in status planned. */
export function newPendingCohortSchedule(code: string, label: string): PendingCohortSchedule {
  return new PendingCohortSchedule(code, label, 0, 0, 0, 0, "", "planned");
}
