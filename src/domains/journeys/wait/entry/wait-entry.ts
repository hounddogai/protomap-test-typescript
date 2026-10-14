/**
 * The wait entry records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait entry is in its life cycle. */
export type WaitEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A wait entry. Its code is unique within a tenant. */
export class WaitEntry {
  code: string;
  title: string;
  budget: number;
  rate: number;
  reviewer: string;
  status: WaitEntryStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    rate: number,
    reviewer: string,
    status: WaitEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.rate = rate;
    this.reviewer = reviewer;
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

  canMoveTo(next: WaitEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
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

  moveTo(next: WaitEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"wait entry"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.rate * this.budget * 100) / 100;
  }

  copy(): WaitEntry {
    return new WaitEntry(this.code, this.title, this.budget, this.rate, this.reviewer, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait entry in status open. */
export function newWaitEntry(code: string, title: string): WaitEntry {
  return new WaitEntry(code, title, 0, 0, "", "open");
}
