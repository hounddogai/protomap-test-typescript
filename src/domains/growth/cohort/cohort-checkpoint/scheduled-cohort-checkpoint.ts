/**
 * The scheduled cohort checkpoint records of growth's cohort work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled cohort checkpoint is in its life cycle. */
export type ScheduledCohortCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a scheduled cohort checkpoint and its current status. */
export class ScheduledCohortCheckpoint {
  code: string;
  label: string;
  channel: string;
  openRate: number;
  ceiling: number;
  externalRef: string;
  threshold: number;
  currency: string;
  status: ScheduledCohortCheckpointStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    openRate: number,
    ceiling: number,
    externalRef: string,
    threshold: number,
    currency: string,
    status: ScheduledCohortCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.currency = currency;
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

  canMoveTo(next: ScheduledCohortCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
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

  moveTo(next: ScheduledCohortCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled cohort checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round(this.ceiling * this.threshold * 100) / 100;
  }

  copy(): ScheduledCohortCheckpoint {
    return new ScheduledCohortCheckpoint(
      this.code,
      this.label,
      this.channel,
      this.openRate,
      this.ceiling,
      this.externalRef,
      this.threshold,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled cohort checkpoint in status planned. */
export function newScheduledCohortCheckpoint(code: string, label: string): ScheduledCohortCheckpoint {
  return new ScheduledCohortCheckpoint(code, label, "", 0, 0, "", 0, "", "planned");
}
