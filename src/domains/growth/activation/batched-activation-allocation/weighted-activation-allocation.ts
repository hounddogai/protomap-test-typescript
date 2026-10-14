/**
 * The weighted activation allocation records of growth's activation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted activation allocation is in its life cycle. */
export type WeightedActivationAllocationStatus = "created" | "validated" | "published" | "retired";

/** The record of a weighted activation allocation and its current status. */
export class WeightedActivationAllocation {
  code: string;
  name: string;
  pinned: boolean;
  campaignRef: string;
  minimum: number;
  impressions: number;
  capacity: number;
  conversionRate: number;
  endsAt: number;
  externalRef: string;
  score: number;
  status: WeightedActivationAllocationStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    campaignRef: string,
    minimum: number,
    impressions: number,
    capacity: number,
    conversionRate: number,
    endsAt: number,
    externalRef: string,
    score: number,
    status: WeightedActivationAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.impressions = impressions;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.score = score;
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

  canMoveTo(next: WeightedActivationAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: WeightedActivationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted activation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted activation allocation"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.impressions - this.capacity) * 100) / 100;
  }

  copy(): WeightedActivationAllocation {
    return new WeightedActivationAllocation(
      this.code,
      this.name,
      this.pinned,
      this.campaignRef,
      this.minimum,
      this.impressions,
      this.capacity,
      this.conversionRate,
      this.endsAt,
      this.externalRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted activation allocation in status created. */
export function newWeightedActivationAllocation(code: string, name: string): WeightedActivationAllocation {
  return new WeightedActivationAllocation(code, name, false, "", 0, 0, 0, 0, 0, "", 0, "created");
}
