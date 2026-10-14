/**
 * The adaptive placement slot records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive placement slot is in its life cycle. */
export type AdaptivePlacementSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive placement slot as the placement team keeps it. */
export class AdaptivePlacementSlot {
  code: string;
  label: string;
  floorValue: number;
  sequence: number;
  rate: number;
  minimum: number;
  name: string;
  limit: number;
  category: string;
  status: AdaptivePlacementSlotStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    sequence: number,
    rate: number,
    minimum: number,
    name: string,
    limit: number,
    category: string,
    status: AdaptivePlacementSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.rate = rate;
    this.minimum = minimum;
    this.name = name;
    this.limit = limit;
    this.category = category;
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

  canMoveTo(next: AdaptivePlacementSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePlacementSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive placement slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.minimum + this.rate) * 100) / 100;
  }

  copy(): AdaptivePlacementSlot {
    return new AdaptivePlacementSlot(
      this.code,
      this.label,
      this.floorValue,
      this.sequence,
      this.rate,
      this.minimum,
      this.name,
      this.limit,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a adaptive placement slot in status requested. */
export function newAdaptivePlacementSlot(code: string, label: string): AdaptivePlacementSlot {
  return new AdaptivePlacementSlot(code, label, 0, 0, 0, 0, "", 0, "", "requested");
}
