/**
 * The suppression slot records of consentcenter's suppression work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression slot is in its life cycle. */
export type SuppressionSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a suppression slot and its current status. */
export class SuppressionSlot {
  code: string;
  label: string;
  createdAt: number;
  pinned: boolean;
  name: string;
  cost: number;
  expiresAt: number;
  cohort: string;
  status: SuppressionSlotStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    pinned: boolean,
    name: string,
    cost: number,
    expiresAt: number,
    cohort: string,
    status: SuppressionSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.pinned = pinned;
    this.name = name;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
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

  canMoveTo(next: SuppressionSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.cost + this.createdAt) * 100) / 100;
  }

  copy(): SuppressionSlot {
    return new SuppressionSlot(
      this.code,
      this.label,
      this.createdAt,
      this.pinned,
      this.name,
      this.cost,
      this.expiresAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression slot in status proposed. */
export function newSuppressionSlot(code: string, label: string): SuppressionSlot {
  return new SuppressionSlot(code, label, 0, false, "", 0, 0, "", "proposed");
}
