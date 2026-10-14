/**
 * The nudge allocation records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge allocation is in its life cycle. */
export type NudgeAllocationStatus = "created" | "validated" | "published" | "retired";

/** A nudge allocation as the nudge team keeps it. */
export class NudgeAllocation {
  code: string;
  name: string;
  notes: string;
  updatedAt: number;
  summary: string;
  budget: number;
  audienceId: string;
  createdAt: number;
  ceiling: number;
  status: NudgeAllocationStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    updatedAt: number,
    summary: string,
    budget: number,
    audienceId: string,
    createdAt: number,
    ceiling: number,
    status: NudgeAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.summary = summary;
    this.budget = budget;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: NudgeAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: NudgeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.ceiling - this.updatedAt) * 100) / 100;
  }

  copy(): NudgeAllocation {
    return new NudgeAllocation(
      this.code,
      this.name,
      this.notes,
      this.updatedAt,
      this.summary,
      this.budget,
      this.audienceId,
      this.createdAt,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a nudge allocation in status created. */
export function newNudgeAllocation(code: string, name: string): NudgeAllocation {
  return new NudgeAllocation(code, name, "", 0, "", 0, "", 0, 0, "created");
}
