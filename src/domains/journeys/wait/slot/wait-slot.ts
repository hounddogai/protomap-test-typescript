/**
 * The wait slot records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait slot is in its life cycle. */
export type WaitSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A wait slot. Its code is unique within a tenant. */
export class WaitSlot {
  code: string;
  label: string;
  cohort: string;
  frequencyCap: number;
  discount: number;
  status: WaitSlotStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    frequencyCap: number,
    discount: number,
    status: WaitSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.frequencyCap = frequencyCap;
    this.discount = discount;
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

  canMoveTo(next: WaitSlotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"wait slot"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.discount * this.frequencyCap * 100) / 100;
  }

  copy(): WaitSlot {
    return new WaitSlot(this.code, this.label, this.cohort, this.frequencyCap, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a wait slot in status open. */
export function newWaitSlot(code: string, label: string): WaitSlot {
  return new WaitSlot(code, label, "", 0, 0, "open");
}
