/**
 * The funnel adjustment records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel adjustment is in its life cycle. */
export type FunnelAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A funnel adjustment as the funnel team keeps it. */
export class FunnelAdjustment {
  code: string;
  name: string;
  threshold: number;
  version: number;
  cost: number;
  timezone: string;
  status: FunnelAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    version: number,
    cost: number,
    timezone: string,
    status: FunnelAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.version = version;
    this.cost = cost;
    this.timezone = timezone;
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

  canMoveTo(next: FunnelAdjustmentStatus): boolean {
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.threshold - this.version) * 100) / 100;
  }

  copy(): FunnelAdjustment {
    return new FunnelAdjustment(
      this.code,
      this.name,
      this.threshold,
      this.version,
      this.cost,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel adjustment in status requested. */
export function newFunnelAdjustment(code: string, name: string): FunnelAdjustment {
  return new FunnelAdjustment(code, name, 0, 0, 0, "", "requested");
}
