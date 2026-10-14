/**
 * The invite window records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite window is in its life cycle. */
export type InviteWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A invite window as the invite team keeps it. */
export class InviteWindow {
  code: string;
  label: string;
  cost: number;
  batchSize: number;
  revision: number;
  conversionRate: number;
  category: string;
  limit: number;
  status: InviteWindowStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    batchSize: number,
    revision: number,
    conversionRate: number,
    category: string,
    limit: number,
    status: InviteWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.batchSize = batchSize;
    this.revision = revision;
    this.conversionRate = conversionRate;
    this.category = category;
    this.limit = limit;
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

  canMoveTo(next: InviteWindowStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round((this.cost - this.batchSize) * 100) / 100;
  }

  copy(): InviteWindow {
    return new InviteWindow(
      this.code,
      this.label,
      this.cost,
      this.batchSize,
      this.revision,
      this.conversionRate,
      this.category,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a invite window in status new. */
export function newInviteWindow(code: string, label: string): InviteWindow {
  return new InviteWindow(code, label, 0, 0, 0, 0, "", 0, "new");
}
