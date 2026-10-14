/**
 * The default redemption override records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default redemption override is in its life cycle. */
export type DefaultRedemptionOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A default redemption override as the redemption team keeps it. */
export class DefaultRedemptionOverride {
  code: string;
  label: string;
  timezone: string;
  ceiling: number;
  notes: string;
  impressions: number;
  variant: string;
  status: DefaultRedemptionOverrideStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    ceiling: number,
    notes: string,
    impressions: number,
    variant: string,
    status: DefaultRedemptionOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.notes = notes;
    this.impressions = impressions;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultRedemptionOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultRedemptionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default redemption override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.ceiling + this.impressions) * 100) / 100;
  }

  copy(): DefaultRedemptionOverride {
    return new DefaultRedemptionOverride(
      this.code,
      this.label,
      this.timezone,
      this.ceiling,
      this.notes,
      this.impressions,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default redemption override in status requested. */
export function newDefaultRedemptionOverride(code: string, label: string): DefaultRedemptionOverride {
  return new DefaultRedemptionOverride(code, label, "", 0, "", 0, "", "requested");
}
