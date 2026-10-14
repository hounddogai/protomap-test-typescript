/**
 * The scheduled reputation adjustment records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled reputation adjustment is in its life cycle. */
export type ScheduledReputationAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled reputation adjustment as the reputation team keeps it. */
export class ScheduledReputationAdjustment {
  code: string;
  title: string;
  journeyId: string;
  reviewer: string;
  label: string;
  quantity: number;
  status: ScheduledReputationAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    reviewer: string,
    label: string,
    quantity: number,
    status: ScheduledReputationAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.label = label;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledReputationAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ScheduledReputationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reputation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ScheduledReputationAdjustment {
    return new ScheduledReputationAdjustment(
      this.code,
      this.title,
      this.journeyId,
      this.reviewer,
      this.label,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled reputation adjustment in status new. */
export function newScheduledReputationAdjustment(code: string, title: string): ScheduledReputationAdjustment {
  return new ScheduledReputationAdjustment(code, title, "", "", "", 0, "new");
}
