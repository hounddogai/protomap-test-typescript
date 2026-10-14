/**
 * The retention slot records of growth's retention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention slot is in its life cycle. */
export type RetentionSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One retention slot, with what the planners need to act on it. */
export class RetentionSlot {
  code: string;
  title: string;
  attempts: number;
  notes: string;
  description: string;
  budget: number;
  openRate: number;
  summary: string;
  status: RetentionSlotStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    notes: string,
    description: string,
    budget: number,
    openRate: number,
    summary: string,
    status: RetentionSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.notes = notes;
    this.description = description;
    this.budget = budget;
    this.openRate = openRate;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.openRate - this.attempts) * 100) / 100;
  }

  copy(): RetentionSlot {
    return new RetentionSlot(
      this.code,
      this.title,
      this.attempts,
      this.notes,
      this.description,
      this.budget,
      this.openRate,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a retention slot in status proposed. */
export function newRetentionSlot(code: string, title: string): RetentionSlot {
  return new RetentionSlot(code, title, 0, "", "", 0, 0, "", "proposed");
}
