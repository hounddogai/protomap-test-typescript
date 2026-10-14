/**
 * The pending streak quota records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending streak quota is in its life cycle. */
export type PendingStreakQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending streak quota, with what the planners need to act on it. */
export class PendingStreakQuota {
  code: string;
  label: string;
  budget: number;
  tags: string[];
  graceDays: number;
  limit: number;
  variant: string;
  phone: string;
  status: PendingStreakQuotaStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    tags: string[],
    graceDays: number,
    limit: number,
    variant: string,
    phone: string,
    status: PendingStreakQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.tags = tags;
    this.graceDays = graceDays;
    this.limit = limit;
    this.variant = variant;
    this.phone = phone;
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

  canMoveTo(next: PendingStreakQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "failed";
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

  moveTo(next: PendingStreakQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending streak quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.limit + this.budget) * 100) / 100;
  }

  copy(): PendingStreakQuota {
    return new PendingStreakQuota(
      this.code,
      this.label,
      this.budget,
      this.tags,
      this.graceDays,
      this.limit,
      this.variant,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending streak quota in status new. */
export function newPendingStreakQuota(code: string, label: string): PendingStreakQuota {
  return new PendingStreakQuota(code, label, 0, [], 0, 0, "", "", "new");
}
