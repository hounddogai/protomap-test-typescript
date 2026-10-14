/**
 * The pending suppression estimate records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending suppression estimate is in its life cycle. */
export type PendingSuppressionEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending suppression estimate. Its code is unique within a tenant. */
export class PendingSuppressionEstimate {
  code: string;
  name: string;
  budget: number;
  sendAt: number;
  externalRef: string;
  timezone: string;
  conversionRate: number;
  status: PendingSuppressionEstimateStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    sendAt: number,
    externalRef: string,
    timezone: string,
    conversionRate: number,
    status: PendingSuppressionEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.sendAt = sendAt;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: PendingSuppressionEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingSuppressionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending suppression estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round((this.sendAt - this.budget) * 100) / 100;
  }

  copy(): PendingSuppressionEstimate {
    return new PendingSuppressionEstimate(
      this.code,
      this.name,
      this.budget,
      this.sendAt,
      this.externalRef,
      this.timezone,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending suppression estimate in status draft. */
export function newPendingSuppressionEstimate(code: string, name: string): PendingSuppressionEstimate {
  return new PendingSuppressionEstimate(code, name, 0, 0, "", "", 0, "draft");
}
