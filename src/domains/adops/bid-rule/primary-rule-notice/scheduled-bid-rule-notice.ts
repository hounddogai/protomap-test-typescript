/**
 * The scheduled bid rule notice records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled bid rule notice is in its life cycle. */
export type ScheduledBidRuleNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a scheduled bid rule notice and its current status. */
export class ScheduledBidRuleNotice {
  code: string;
  label: string;
  reviewer: string;
  margin: number;
  attempts: number;
  audienceId: string;
  priority: number;
  budget: number;
  description: string;
  status: ScheduledBidRuleNoticeStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    margin: number,
    attempts: number,
    audienceId: string,
    priority: number,
    budget: number,
    description: string,
    status: ScheduledBidRuleNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.margin = margin;
    this.attempts = attempts;
    this.audienceId = audienceId;
    this.priority = priority;
    this.budget = budget;
    this.description = description;
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

  canMoveTo(next: ScheduledBidRuleNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledBidRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled bid rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.attempts + this.budget) * 100) / 100;
  }

  copy(): ScheduledBidRuleNotice {
    return new ScheduledBidRuleNotice(
      this.code,
      this.label,
      this.reviewer,
      this.margin,
      this.attempts,
      this.audienceId,
      this.priority,
      this.budget,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled bid rule notice in status open. */
export function newScheduledBidRuleNotice(code: string, label: string): ScheduledBidRuleNotice {
  return new ScheduledBidRuleNotice(code, label, "", 0, 0, "", 0, 0, "", "open");
}
