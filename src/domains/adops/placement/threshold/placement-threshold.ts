/**
 * The placement threshold records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement threshold is in its life cycle. */
export type PlacementThresholdStatus = "created" | "validated" | "published" | "retired";

/** A placement threshold. Its code is unique within a tenant. */
export class PlacementThreshold {
  code: string;
  name: string;
  batchSize: number;
  journeyId: string;
  minimum: number;
  approved: boolean;
  rate: number;
  currency: string;
  status: PlacementThresholdStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    journeyId: string,
    minimum: number,
    approved: boolean,
    rate: number,
    currency: string,
    status: PlacementThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.journeyId = journeyId;
    this.minimum = minimum;
    this.approved = approved;
    this.rate = rate;
    this.currency = currency;
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

  canMoveTo(next: PlacementThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PlacementThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.minimum + this.rate) * 100) / 100;
  }

  copy(): PlacementThreshold {
    return new PlacementThreshold(
      this.code,
      this.name,
      this.batchSize,
      this.journeyId,
      this.minimum,
      this.approved,
      this.rate,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a placement threshold in status created. */
export function newPlacementThreshold(code: string, name: string): PlacementThreshold {
  return new PlacementThreshold(code, name, 0, "", 0, false, 0, "", "created");
}
