/**
 * The scheduled reward profile records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled reward profile is in its life cycle. */
export type ScheduledRewardProfileStatus = "created" | "validated" | "published" | "retired";

/** A scheduled reward profile as the reward team keeps it. */
export class ScheduledRewardProfile {
  code: string;
  label: string;
  margin: number;
  reviewer: string;
  segment: string;
  variant: string;
  status: ScheduledRewardProfileStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    reviewer: string,
    segment: string,
    variant: string,
    status: ScheduledRewardProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.reviewer = reviewer;
    this.segment = segment;
    this.variant = variant;
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

  canMoveTo(next: ScheduledRewardProfileStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledRewardProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reward profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled reward profile"} ${this.code}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): ScheduledRewardProfile {
    return new ScheduledRewardProfile(
      this.code,
      this.label,
      this.margin,
      this.reviewer,
      this.segment,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled reward profile in status created. */
export function newScheduledRewardProfile(code: string, label: string): ScheduledRewardProfile {
  return new ScheduledRewardProfile(code, label, 0, "", "", "", "created");
}
