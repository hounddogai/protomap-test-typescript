/**
 * The weighted challenge slot records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted challenge slot is in its life cycle. */
export type WeightedChallengeSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted challenge slot. Its code is unique within a tenant. */
export class WeightedChallengeSlot {
  code: string;
  label: string;
  batchSize: number;
  bid: number;
  minimum: number;
  windowDays: number;
  sequence: number;
  floorValue: number;
  margin: number;
  budget: number;
  status: WeightedChallengeSlotStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    bid: number,
    minimum: number,
    windowDays: number,
    sequence: number,
    floorValue: number,
    margin: number,
    budget: number,
    status: WeightedChallengeSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.bid = bid;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.sequence = sequence;
    this.floorValue = floorValue;
    this.margin = margin;
    this.budget = budget;
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

  canMoveTo(next: WeightedChallengeSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedChallengeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted challenge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted challenge slot"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.budget * this.sequence * 100) / 100;
  }

  copy(): WeightedChallengeSlot {
    return new WeightedChallengeSlot(
      this.code,
      this.label,
      this.batchSize,
      this.bid,
      this.minimum,
      this.windowDays,
      this.sequence,
      this.floorValue,
      this.margin,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted challenge slot in status requested. */
export function newWeightedChallengeSlot(code: string, label: string): WeightedChallengeSlot {
  return new WeightedChallengeSlot(code, label, 0, 0, 0, 0, 0, 0, 0, 0, "requested");
}
