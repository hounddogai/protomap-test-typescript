/**
 * The tiered cohort quota records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered cohort quota is in its life cycle. */
export type TieredCohortQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered cohort quota. Its code is unique within a tenant. */
export class TieredCohortQuota {
  code: string;
  title: string;
  cost: number;
  summary: string;
  rate: number;
  endsAt: number;
  expiresAt: number;
  status: TieredCohortQuotaStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    summary: string,
    rate: number,
    endsAt: number,
    expiresAt: number,
    status: TieredCohortQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.summary = summary;
    this.rate = rate;
    this.endsAt = endsAt;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: TieredCohortQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredCohortQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered cohort quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round((this.cost + this.endsAt) * 100) / 100;
  }

  copy(): TieredCohortQuota {
    return new TieredCohortQuota(
      this.code,
      this.title,
      this.cost,
      this.summary,
      this.rate,
      this.endsAt,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered cohort quota in status idle. */
export function newTieredCohortQuota(code: string, title: string): TieredCohortQuota {
  return new TieredCohortQuota(code, title, 0, "", 0, 0, 0, "idle");
}
