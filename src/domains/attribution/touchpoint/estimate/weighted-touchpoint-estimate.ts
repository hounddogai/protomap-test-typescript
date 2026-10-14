/**
 * The weighted touchpoint estimate records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted touchpoint estimate is in its life cycle. */
export type WeightedTouchpointEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted touchpoint estimate. Its code is unique within a tenant. */
export class WeightedTouchpointEstimate {
  code: string;
  name: string;
  rate: number;
  ownerId: string;
  approved: boolean;
  status: WeightedTouchpointEstimateStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    ownerId: string,
    approved: boolean,
    status: WeightedTouchpointEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.ownerId = ownerId;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedTouchpointEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedTouchpointEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted touchpoint estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): WeightedTouchpointEstimate {
    return new WeightedTouchpointEstimate(this.code, this.name, this.rate, this.ownerId, this.approved, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted touchpoint estimate in status planned. */
export function newWeightedTouchpointEstimate(code: string, name: string): WeightedTouchpointEstimate {
  return new WeightedTouchpointEstimate(code, name, 0, "", false, "planned");
}
