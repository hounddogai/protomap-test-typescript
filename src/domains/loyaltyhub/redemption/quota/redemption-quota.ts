/**
 * The redemption quota records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption quota is in its life cycle. */
export type RedemptionQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** One redemption quota, with what the planners need to act on it. */
export class RedemptionQuota {
  code: string;
  title: string;
  priority: number;
  cost: number;
  externalRef: string;
  ratio: number;
  margin: number;
  status: RedemptionQuotaStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    cost: number,
    externalRef: string,
    ratio: number,
    margin: number,
    status: RedemptionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.cost = cost;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.margin = margin;
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

  canMoveTo(next: RedemptionQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: RedemptionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round(this.cost * this.margin * 100) / 100;
  }

  copy(): RedemptionQuota {
    return new RedemptionQuota(
      this.code,
      this.title,
      this.priority,
      this.cost,
      this.externalRef,
      this.ratio,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a redemption quota in status new. */
export function newRedemptionQuota(code: string, title: string): RedemptionQuota {
  return new RedemptionQuota(code, title, 0, 0, "", 0, 0, "new");
}
