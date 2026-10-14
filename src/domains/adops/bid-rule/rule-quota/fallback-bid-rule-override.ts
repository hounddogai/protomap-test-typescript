import * as text from "../../../../kit/text.js";

/** Where a fallback bid rule override is in its life cycle. */
export type FallbackBidRuleOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback bid rule override and its current status. */
export class FallbackBidRuleOverride {
  code: string;
  label: string;
  attempts: number;
  reviewer: string;
  budget: number;
  timezone: string;
  expiresAt: number;
  discount: number;
  bid: number;
  status: FallbackBidRuleOverrideStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    reviewer: string,
    budget: number,
    timezone: string,
    expiresAt: number,
    discount: number,
    bid: number,
    status: FallbackBidRuleOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.budget = budget;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackBidRuleOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackBidRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bid rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget + this.bid) * 100) / 100;
  }

  copy(): FallbackBidRuleOverride {
    return new FallbackBidRuleOverride(
      this.code,
      this.label,
      this.attempts,
      this.reviewer,
      this.budget,
      this.timezone,
      this.expiresAt,
      this.discount,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback bid rule override in status open. */
export function newFallbackBidRuleOverride(code: string, label: string): FallbackBidRuleOverride {
  return new FallbackBidRuleOverride(code, label, 0, "", 0, "", 0, 0, 0, "open");
}
