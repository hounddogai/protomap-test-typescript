/**
 * The branch bundle records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch bundle is in its life cycle. */
export type BranchBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A branch bundle. Its code is unique within a tenant. */
export class BranchBundle {
  code: string;
  label: string;
  amount: number;
  capacity: number;
  externalRef: string;
  reviewer: string;
  ceiling: number;
  endsAt: number;
  ownerId: string;
  budget: number;
  sendAt: number;
  status: BranchBundleStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    capacity: number,
    externalRef: string,
    reviewer: string,
    ceiling: number,
    endsAt: number,
    ownerId: string,
    budget: number,
    sendAt: number,
    status: BranchBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.capacity = capacity;
    this.externalRef = externalRef;
    this.reviewer = reviewer;
    this.ceiling = ceiling;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.budget = budget;
    this.sendAt = sendAt;
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

  canMoveTo(next: BranchBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BranchBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"branch bundle"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.budget - this.amount) * 100) / 100;
  }

  copy(): BranchBundle {
    return new BranchBundle(
      this.code,
      this.label,
      this.amount,
      this.capacity,
      this.externalRef,
      this.reviewer,
      this.ceiling,
      this.endsAt,
      this.ownerId,
      this.budget,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a branch bundle in status planned. */
export function newBranchBundle(code: string, label: string): BranchBundle {
  return new BranchBundle(code, label, 0, 0, "", "", 0, 0, "", 0, 0, "planned");
}
