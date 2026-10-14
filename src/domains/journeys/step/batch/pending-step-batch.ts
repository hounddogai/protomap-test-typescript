/**
 * The pending step batch records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending step batch is in its life cycle. */
export type PendingStepBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending step batch, with what the planners need to act on it. */
export class PendingStepBatch {
  code: string;
  title: string;
  variant: string;
  updatedAt: number;
  description: string;
  timezone: string;
  budget: number;
  cost: number;
  status: PendingStepBatchStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    updatedAt: number,
    description: string,
    timezone: string,
    budget: number,
    cost: number,
    status: PendingStepBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.description = description;
    this.timezone = timezone;
    this.budget = budget;
    this.cost = cost;
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

  canMoveTo(next: PendingStepBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingStepBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending step batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.updatedAt - this.budget) * 100) / 100;
  }

  copy(): PendingStepBatch {
    return new PendingStepBatch(
      this.code,
      this.title,
      this.variant,
      this.updatedAt,
      this.description,
      this.timezone,
      this.budget,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending step batch in status new. */
export function newPendingStepBatch(code: string, title: string): PendingStepBatch {
  return new PendingStepBatch(code, title, "", 0, "", "", 0, 0, "new");
}
