/**
 * The pending tier variance records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending tier variance is in its life cycle. */
export type PendingTierVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pending tier variance and its current status. */
export class PendingTierVariance {
  code: string;
  name: string;
  minimum: number;
  floorValue: number;
  batchSize: number;
  revision: number;
  budget: number;
  status: PendingTierVarianceStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    floorValue: number,
    batchSize: number,
    revision: number,
    budget: number,
    status: PendingTierVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.floorValue = floorValue;
    this.batchSize = batchSize;
    this.revision = revision;
    this.budget = budget;
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

  canMoveTo(next: PendingTierVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
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

  moveTo(next: PendingTierVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending tier variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round(this.budget * this.minimum * 100) / 100;
  }

  copy(): PendingTierVariance {
    return new PendingTierVariance(
      this.code,
      this.name,
      this.minimum,
      this.floorValue,
      this.batchSize,
      this.revision,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending tier variance in status idle. */
export function newPendingTierVariance(code: string, name: string): PendingTierVariance {
  return new PendingTierVariance(code, name, 0, 0, 0, 0, 0, "idle");
}
