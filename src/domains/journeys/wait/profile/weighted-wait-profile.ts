/**
 * The weighted wait profile records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted wait profile is in its life cycle. */
export type WeightedWaitProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted wait profile. Its code is unique within a tenant. */
export class WeightedWaitProfile {
  code: string;
  label: string;
  active: boolean;
  margin: number;
  cost: number;
  quantity: number;
  status: WeightedWaitProfileStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    margin: number,
    cost: number,
    quantity: number,
    status: WeightedWaitProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.margin = margin;
    this.cost = cost;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedWaitProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedWaitProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted wait profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.cost + this.quantity) * 100) / 100;
  }

  copy(): WeightedWaitProfile {
    return new WeightedWaitProfile(
      this.code,
      this.label,
      this.active,
      this.margin,
      this.cost,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted wait profile in status proposed. */
export function newWeightedWaitProfile(code: string, label: string): WeightedWaitProfile {
  return new WeightedWaitProfile(code, label, false, 0, 0, 0, "proposed");
}
