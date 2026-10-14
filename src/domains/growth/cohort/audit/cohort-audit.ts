/**
 * The cohort audit records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort audit is in its life cycle. */
export type CohortAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A cohort audit as the cohort team keeps it. */
export class CohortAudit {
  code: string;
  label: string;
  ceiling: number;
  rate: number;
  discount: number;
  limit: number;
  category: string;
  active: boolean;
  status: CohortAuditStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    rate: number,
    discount: number,
    limit: number,
    category: string,
    active: boolean,
    status: CohortAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.rate = rate;
    this.discount = discount;
    this.limit = limit;
    this.category = category;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CohortAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.limit + this.discount) * 100) / 100;
  }

  copy(): CohortAudit {
    return new CohortAudit(
      this.code,
      this.label,
      this.ceiling,
      this.rate,
      this.discount,
      this.limit,
      this.category,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a cohort audit in status idle. */
export function newCohortAudit(code: string, label: string): CohortAudit {
  return new CohortAudit(code, label, 0, 0, 0, 0, "", false, "idle");
}
