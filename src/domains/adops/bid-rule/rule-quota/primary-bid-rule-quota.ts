/**
 * The primary bid rule quota records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary bid rule quota is in its life cycle. */
export type PrimaryBidRuleQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One primary bid rule quota, with what the planners need to act on it. */
export class PrimaryBidRuleQuota {
  code: string;
  title: string;
  maximum: number;
  externalRef: string;
  margin: number;
  status: PrimaryBidRuleQuotaStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    externalRef: string,
    margin: number,
    status: PrimaryBidRuleQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.externalRef = externalRef;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryBidRuleQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryBidRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary bid rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.margin - this.maximum) * 100) / 100;
  }

  copy(): PrimaryBidRuleQuota {
    return new PrimaryBidRuleQuota(this.code, this.title, this.maximum, this.externalRef, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary bid rule quota in status proposed. */
export function newPrimaryBidRuleQuota(code: string, title: string): PrimaryBidRuleQuota {
  return new PrimaryBidRuleQuota(code, title, 0, "", 0, "proposed");
}
