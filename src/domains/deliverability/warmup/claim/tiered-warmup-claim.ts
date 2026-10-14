/**
 * The tiered warmup claim records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered warmup claim is in its life cycle. */
export type TieredWarmupClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered warmup claim and its current status. */
export class TieredWarmupClaim {
  code: string;
  label: string;
  description: string;
  updatedAt: number;
  cost: number;
  category: string;
  locale: string;
  version: number;
  status: TieredWarmupClaimStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    updatedAt: number,
    cost: number,
    category: string,
    locale: string,
    version: number,
    status: TieredWarmupClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.updatedAt = updatedAt;
    this.cost = cost;
    this.category = category;
    this.locale = locale;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredWarmupClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredWarmupClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered warmup claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.updatedAt - this.version) * 100) / 100;
  }

  copy(): TieredWarmupClaim {
    return new TieredWarmupClaim(
      this.code,
      this.label,
      this.description,
      this.updatedAt,
      this.cost,
      this.category,
      this.locale,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered warmup claim in status idle. */
export function newTieredWarmupClaim(code: string, label: string): TieredWarmupClaim {
  return new TieredWarmupClaim(code, label, "", 0, 0, "", "", 0, "idle");
}
