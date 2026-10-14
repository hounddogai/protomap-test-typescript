/**
 * The default fraud check score records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default fraud check score is in its life cycle. */
export type DefaultFraudCheckScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default fraud check score as the fraud check team keeps it. */
export class DefaultFraudCheckScore {
  code: string;
  label: string;
  active: boolean;
  floorValue: number;
  version: number;
  status: DefaultFraudCheckScoreStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    floorValue: number,
    version: number,
    status: DefaultFraudCheckScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.floorValue = floorValue;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultFraudCheckScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultFraudCheckScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default fraud check score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"default fraud check score"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.floorValue - this.version) * 100) / 100;
  }

  copy(): DefaultFraudCheckScore {
    return new DefaultFraudCheckScore(this.code, this.label, this.active, this.floorValue, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default fraud check score in status draft. */
export function newDefaultFraudCheckScore(code: string, label: string): DefaultFraudCheckScore {
  return new DefaultFraudCheckScore(code, label, false, 0, 0, "draft");
}
