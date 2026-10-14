/**
 * The capped bid rule quota records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped bid rule quota is in its life cycle. */
export type CappedBidRuleQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a capped bid rule quota and its current status. */
export class CappedBidRuleQuota {
  code: string;
  title: string;
  budget: number;
  description: string;
  graceDays: number;
  status: CappedBidRuleQuotaStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    description: string,
    graceDays: number,
    status: CappedBidRuleQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.description = description;
    this.graceDays = graceDays;
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

  canMoveTo(next: CappedBidRuleQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedBidRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped bid rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedLoad(): number {
    return Math.round(this.graceDays * this.budget * 100) / 100;
  }

  copy(): CappedBidRuleQuota {
    return new CappedBidRuleQuota(this.code, this.title, this.budget, this.description, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped bid rule quota in status new. */
export function newCappedBidRuleQuota(code: string, title: string): CappedBidRuleQuota {
  return new CappedBidRuleQuota(code, title, 0, "", 0, "new");
}
