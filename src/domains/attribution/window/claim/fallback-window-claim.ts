/**
 * The fallback window claim records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback window claim is in its life cycle. */
export type FallbackWindowClaimStatus = "created" | "validated" | "published" | "retired";

/** A fallback window claim as the window team keeps it. */
export class FallbackWindowClaim {
  code: string;
  label: string;
  version: number;
  category: string;
  impressions: number;
  threshold: number;
  cost: number;
  status: FallbackWindowClaimStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    category: string,
    impressions: number,
    threshold: number,
    cost: number,
    status: FallbackWindowClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.category = category;
    this.impressions = impressions;
    this.threshold = threshold;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackWindowClaimStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackWindowClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback window claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.threshold + this.cost) * 100) / 100;
  }

  copy(): FallbackWindowClaim {
    return new FallbackWindowClaim(
      this.code,
      this.label,
      this.version,
      this.category,
      this.impressions,
      this.threshold,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback window claim in status created. */
export function newFallbackWindowClaim(code: string, label: string): FallbackWindowClaim {
  return new FallbackWindowClaim(code, label, 0, "", 0, 0, 0, "created");
}
