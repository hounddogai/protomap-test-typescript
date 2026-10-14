/**
 * The strict exit rule summary records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict exit rule summary is in its life cycle. */
export type StrictExitRuleSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict exit rule summary and its current status. */
export class StrictExitRuleSummary {
  code: string;
  label: string;
  quantity: number;
  segment: string;
  checksum: string;
  createdAt: number;
  expiresAt: number;
  status: StrictExitRuleSummaryStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    segment: string,
    checksum: string,
    createdAt: number,
    expiresAt: number,
    status: StrictExitRuleSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.segment = segment;
    this.checksum = checksum;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: StrictExitRuleSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictExitRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict exit rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict exit rule summary"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.createdAt + this.quantity) * 100) / 100;
  }

  copy(): StrictExitRuleSummary {
    return new StrictExitRuleSummary(
      this.code,
      this.label,
      this.quantity,
      this.segment,
      this.checksum,
      this.createdAt,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict exit rule summary in status new. */
export function newStrictExitRuleSummary(code: string, label: string): StrictExitRuleSummary {
  return new StrictExitRuleSummary(code, label, 0, "", "", 0, 0, "new");
}
