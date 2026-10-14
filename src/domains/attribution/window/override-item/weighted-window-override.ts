/**
 * The weighted window override records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted window override is in its life cycle. */
export type WeightedWindowOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a weighted window override and its current status. */
export class WeightedWindowOverride {
  code: string;
  label: string;
  amount: number;
  score: number;
  clicks: number;
  startsAt: number;
  version: number;
  status: WeightedWindowOverrideStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    score: number,
    clicks: number,
    startsAt: number,
    version: number,
    status: WeightedWindowOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.score = score;
    this.clicks = clicks;
    this.startsAt = startsAt;
    this.version = version;
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

  canMoveTo(next: WeightedWindowOverrideStatus): boolean {
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
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedWindowOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted window override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"weighted window override"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.amount - this.clicks) * 100) / 100;
  }

  copy(): WeightedWindowOverride {
    return new WeightedWindowOverride(
      this.code,
      this.label,
      this.amount,
      this.score,
      this.clicks,
      this.startsAt,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted window override in status requested. */
export function newWeightedWindowOverride(code: string, label: string): WeightedWindowOverride {
  return new WeightedWindowOverride(code, label, 0, 0, 0, 0, 0, "requested");
}
