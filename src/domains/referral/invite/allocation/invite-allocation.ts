/**
 * The invite allocation records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite allocation is in its life cycle. */
export type InviteAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a invite allocation and its current status. */
export class InviteAllocation {
  code: string;
  label: string;
  pinned: boolean;
  description: string;
  retries: number;
  category: string;
  durationMinutes: number;
  score: number;
  graceDays: number;
  status: InviteAllocationStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    description: string,
    retries: number,
    category: string,
    durationMinutes: number,
    score: number,
    graceDays: number,
    status: InviteAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.description = description;
    this.retries = retries;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.score = score;
    this.graceDays = graceDays;
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

  canMoveTo(next: InviteAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: InviteAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round(this.graceDays * this.retries * 100) / 100;
  }

  copy(): InviteAllocation {
    return new InviteAllocation(
      this.code,
      this.label,
      this.pinned,
      this.description,
      this.retries,
      this.category,
      this.durationMinutes,
      this.score,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a invite allocation in status draft. */
export function newInviteAllocation(code: string, label: string): InviteAllocation {
  return new InviteAllocation(code, label, false, "", 0, "", 0, 0, 0, "draft");
}
