/**
 * The default credit estimate records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default credit estimate is in its life cycle. */
export type DefaultCreditEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default credit estimate. Its code is unique within a tenant. */
export class DefaultCreditEstimate {
  code: string;
  name: string;
  budget: number;
  minimum: number;
  clicks: number;
  bid: number;
  durationMinutes: number;
  category: string;
  updatedAt: number;
  summary: string;
  attempts: number;
  status: DefaultCreditEstimateStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    minimum: number,
    clicks: number,
    bid: number,
    durationMinutes: number,
    category: string,
    updatedAt: number,
    summary: string,
    attempts: number,
    status: DefaultCreditEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.minimum = minimum;
    this.clicks = clicks;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.category = category;
    this.updatedAt = updatedAt;
    this.summary = summary;
    this.attempts = attempts;
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

  canMoveTo(next: DefaultCreditEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultCreditEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default credit estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default credit estimate"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.clicks - this.minimum) * 100) / 100;
  }

  copy(): DefaultCreditEstimate {
    return new DefaultCreditEstimate(
      this.code,
      this.name,
      this.budget,
      this.minimum,
      this.clicks,
      this.bid,
      this.durationMinutes,
      this.category,
      this.updatedAt,
      this.summary,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a default credit estimate in status proposed. */
export function newDefaultCreditEstimate(code: string, name: string): DefaultCreditEstimate {
  return new DefaultCreditEstimate(code, name, 0, 0, 0, 0, 0, "", 0, "", 0, "proposed");
}
