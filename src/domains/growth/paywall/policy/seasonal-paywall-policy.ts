/**
 * The seasonal paywall policy records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal paywall policy is in its life cycle. */
export type SeasonalPaywallPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a seasonal paywall policy and its current status. */
export class SeasonalPaywallPolicy {
  code: string;
  label: string;
  approved: boolean;
  margin: number;
  phone: string;
  status: SeasonalPaywallPolicyStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    margin: number,
    phone: string,
    status: SeasonalPaywallPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.margin = margin;
    this.phone = phone;
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

  canMoveTo(next: SeasonalPaywallPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalPaywallPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal paywall policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal paywall policy"} ${this.code}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): SeasonalPaywallPolicy {
    return new SeasonalPaywallPolicy(this.code, this.label, this.approved, this.margin, this.phone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal paywall policy in status draft. */
export function newSeasonalPaywallPolicy(code: string, label: string): SeasonalPaywallPolicy {
  return new SeasonalPaywallPolicy(code, label, false, 0, "", "draft");
}
