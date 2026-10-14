/**
 * The adaptive model adjustment records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive model adjustment is in its life cycle. */
export type AdaptiveModelAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One adaptive model adjustment, with what the planners need to act on it. */
export class AdaptiveModelAdjustment {
  code: string;
  title: string;
  limit: number;
  sequence: number;
  budget: number;
  createdAt: number;
  status: AdaptiveModelAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    sequence: number,
    budget: number,
    createdAt: number,
    status: AdaptiveModelAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.sequence = sequence;
    this.budget = budget;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveModelAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: AdaptiveModelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive model adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.sequence + this.limit) * 100) / 100;
  }

  copy(): AdaptiveModelAdjustment {
    return new AdaptiveModelAdjustment(
      this.code,
      this.title,
      this.limit,
      this.sequence,
      this.budget,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive model adjustment in status requested. */
export function newAdaptiveModelAdjustment(code: string, title: string): AdaptiveModelAdjustment {
  return new AdaptiveModelAdjustment(code, title, 0, 0, 0, 0, "requested");
}
