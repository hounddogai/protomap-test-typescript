/**
 * The cohort quota records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort quota is in its life cycle. */
export type CohortQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort quota as the cohort team keeps it. */
export class CohortQuota {
  code: string;
  name: string;
  score: number;
  cost: number;
  quantity: number;
  clicks: number;
  checksum: string;
  status: CohortQuotaStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    cost: number,
    quantity: number,
    clicks: number,
    checksum: string,
    status: CohortQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.cost = cost;
    this.quantity = quantity;
    this.clicks = clicks;
    this.checksum = checksum;
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

  canMoveTo(next: CohortQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CohortQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round((this.cost - this.quantity) * 100) / 100;
  }

  copy(): CohortQuota {
    return new CohortQuota(
      this.code,
      this.name,
      this.score,
      this.cost,
      this.quantity,
      this.clicks,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a cohort quota in status draft. */
export function newCohortQuota(code: string, name: string): CohortQuota {
  return new CohortQuota(code, name, 0, 0, 0, 0, "", "draft");
}
