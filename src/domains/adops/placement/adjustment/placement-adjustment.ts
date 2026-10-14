/**
 * The placement adjustment records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement adjustment is in its life cycle. */
export type PlacementAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A placement adjustment. Its code is unique within a tenant. */
export class PlacementAdjustment {
  code: string;
  label: string;
  maximum: number;
  attempts: number;
  rate: number;
  archived: boolean;
  status: PlacementAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    attempts: number,
    rate: number,
    archived: boolean,
    status: PlacementAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.attempts = attempts;
    this.rate = rate;
    this.archived = archived;
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

  canMoveTo(next: PlacementAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PlacementAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"placement adjustment"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.attempts * this.rate * 100) / 100;
  }

  copy(): PlacementAdjustment {
    return new PlacementAdjustment(
      this.code,
      this.label,
      this.maximum,
      this.attempts,
      this.rate,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a placement adjustment in status created. */
export function newPlacementAdjustment(code: string, label: string): PlacementAdjustment {
  return new PlacementAdjustment(code, label, 0, 0, 0, false, "created");
}
