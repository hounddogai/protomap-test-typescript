/**
 * The batched macro score records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched macro score is in its life cycle. */
export type BatchedMacroScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched macro score, with what the planners need to act on it. */
export class BatchedMacroScore {
  code: string;
  name: string;
  expiresAt: number;
  threshold: number;
  budget: number;
  status: BatchedMacroScoreStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    threshold: number,
    budget: number,
    status: BatchedMacroScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.threshold = threshold;
    this.budget = budget;
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

  canMoveTo(next: BatchedMacroScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedMacroScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched macro score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched macro score"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.expiresAt * this.budget * 100) / 100;
  }

  copy(): BatchedMacroScore {
    return new BatchedMacroScore(this.code, this.name, this.expiresAt, this.threshold, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched macro score in status planned. */
export function newBatchedMacroScore(code: string, name: string): BatchedMacroScore {
  return new BatchedMacroScore(code, name, 0, 0, 0, "planned");
}
