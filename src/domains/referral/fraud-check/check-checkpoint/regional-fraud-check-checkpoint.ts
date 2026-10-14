/**
 * The regional fraud check checkpoint records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional fraud check checkpoint is in its life cycle. */
export type RegionalFraudCheckCheckpointStatus = "created" | "validated" | "published" | "retired";

/** The record of a regional fraud check checkpoint and its current status. */
export class RegionalFraudCheckCheckpoint {
  code: string;
  label: string;
  minimum: number;
  margin: number;
  clicks: number;
  openRate: number;
  ceiling: number;
  pinned: boolean;
  status: RegionalFraudCheckCheckpointStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    margin: number,
    clicks: number,
    openRate: number,
    ceiling: number,
    pinned: boolean,
    status: RegionalFraudCheckCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.margin = margin;
    this.clicks = clicks;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.pinned = pinned;
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

  canMoveTo(next: RegionalFraudCheckCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalFraudCheckCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional fraud check checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.minimum - this.ceiling) * 100) / 100;
  }

  copy(): RegionalFraudCheckCheckpoint {
    return new RegionalFraudCheckCheckpoint(
      this.code,
      this.label,
      this.minimum,
      this.margin,
      this.clicks,
      this.openRate,
      this.ceiling,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional fraud check checkpoint in status created. */
export function newRegionalFraudCheckCheckpoint(code: string, label: string): RegionalFraudCheckCheckpoint {
  return new RegionalFraudCheckCheckpoint(code, label, 0, 0, 0, 0, 0, false, "created");
}
