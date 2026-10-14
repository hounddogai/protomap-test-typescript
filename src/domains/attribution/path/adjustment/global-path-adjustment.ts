/**
 * The global path adjustment records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global path adjustment is in its life cycle. */
export type GlobalPathAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a global path adjustment and its current status. */
export class GlobalPathAdjustment {
  code: string;
  label: string;
  utmSource: string;
  category: string;
  amount: number;
  sendAt: number;
  status: GlobalPathAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    category: string,
    amount: number,
    sendAt: number,
    status: GlobalPathAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.category = category;
    this.amount = amount;
    this.sendAt = sendAt;
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

  canMoveTo(next: GlobalPathAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
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

  moveTo(next: GlobalPathAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global path adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global path adjustment"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.amount - this.sendAt) * 100) / 100;
  }

  copy(): GlobalPathAdjustment {
    return new GlobalPathAdjustment(
      this.code,
      this.label,
      this.utmSource,
      this.category,
      this.amount,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a global path adjustment in status new. */
export function newGlobalPathAdjustment(code: string, label: string): GlobalPathAdjustment {
  return new GlobalPathAdjustment(code, label, "", "", 0, 0, "new");
}
