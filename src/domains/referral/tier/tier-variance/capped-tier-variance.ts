/**
 * The capped tier variance records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped tier variance is in its life cycle. */
export type CappedTierVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One capped tier variance, with what the planners need to act on it. */
export class CappedTierVariance {
  code: string;
  title: string;
  label: string;
  capacity: number;
  visible: boolean;
  batchSize: number;
  unit: string;
  status: CappedTierVarianceStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    capacity: number,
    visible: boolean,
    batchSize: number,
    unit: string,
    status: CappedTierVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.capacity = capacity;
    this.visible = visible;
    this.batchSize = batchSize;
    this.unit = unit;
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

  canMoveTo(next: CappedTierVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CappedTierVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped tier variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  netVolume(): number {
    return Math.round((this.batchSize + this.capacity) * 100) / 100;
  }

  copy(): CappedTierVariance {
    return new CappedTierVariance(
      this.code,
      this.title,
      this.label,
      this.capacity,
      this.visible,
      this.batchSize,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped tier variance in status draft. */
export function newCappedTierVariance(code: string, title: string): CappedTierVariance {
  return new CappedTierVariance(code, title, "", 0, false, 0, "", "draft");
}
