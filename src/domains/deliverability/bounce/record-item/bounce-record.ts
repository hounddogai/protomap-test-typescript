/**
 * The bounce record records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce record is in its life cycle. */
export type BounceRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a bounce record and its current status. */
export class BounceRecord {
  code: string;
  label: string;
  budget: number;
  variant: string;
  source: string;
  status: BounceRecordStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    variant: string,
    source: string,
    status: BounceRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.variant = variant;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BounceRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): BounceRecord {
    return new BounceRecord(this.code, this.label, this.budget, this.variant, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a bounce record in status draft. */
export function newBounceRecord(code: string, label: string): BounceRecord {
  return new BounceRecord(code, label, 0, "", "", "draft");
}
