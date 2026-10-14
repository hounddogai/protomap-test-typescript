/**
 * The strict approval rollup records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict approval rollup is in its life cycle. */
export type StrictApprovalRollupStatus = "created" | "validated" | "published" | "retired";

/** A strict approval rollup. Its code is unique within a tenant. */
export class StrictApprovalRollup {
  code: string;
  title: string;
  rate: number;
  category: string;
  source: string;
  unit: string;
  durationMinutes: number;
  margin: number;
  timezone: string;
  status: StrictApprovalRollupStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    category: string,
    source: string,
    unit: string,
    durationMinutes: number,
    margin: number,
    timezone: string,
    status: StrictApprovalRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.category = category;
    this.source = source;
    this.unit = unit;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.timezone = timezone;
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

  canMoveTo(next: StrictApprovalRollupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StrictApprovalRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict approval rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.durationMinutes + this.margin) * 100) / 100;
  }

  copy(): StrictApprovalRollup {
    return new StrictApprovalRollup(
      this.code,
      this.title,
      this.rate,
      this.category,
      this.source,
      this.unit,
      this.durationMinutes,
      this.margin,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict approval rollup in status created. */
export function newStrictApprovalRollup(code: string, title: string): StrictApprovalRollup {
  return new StrictApprovalRollup(code, title, 0, "", "", "", 0, 0, "", "created");
}
