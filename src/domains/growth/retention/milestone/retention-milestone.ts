/**
 * The retention milestone records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention milestone is in its life cycle. */
export type RetentionMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A retention milestone. Its code is unique within a tenant. */
export class RetentionMilestone {
  code: string;
  label: string;
  reviewer: string;
  phone: string;
  currency: string;
  segment: string;
  attempts: number;
  timezone: string;
  createdAt: number;
  status: RetentionMilestoneStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    phone: string,
    currency: string,
    segment: string,
    attempts: number,
    timezone: string,
    createdAt: number,
    status: RetentionMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.phone = phone;
    this.currency = currency;
    this.segment = segment;
    this.attempts = attempts;
    this.timezone = timezone;
    this.createdAt = createdAt;
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

  canMoveTo(next: RetentionMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RetentionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round((this.attempts + this.createdAt) * 100) / 100;
  }

  copy(): RetentionMilestone {
    return new RetentionMilestone(
      this.code,
      this.label,
      this.reviewer,
      this.phone,
      this.currency,
      this.segment,
      this.attempts,
      this.timezone,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a retention milestone in status idle. */
export function newRetentionMilestone(code: string, label: string): RetentionMilestone {
  return new RetentionMilestone(code, label, "", "", "", "", 0, "", 0, "idle");
}
