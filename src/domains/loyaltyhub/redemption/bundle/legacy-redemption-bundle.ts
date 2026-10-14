/**
 * The legacy redemption bundle records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy redemption bundle is in its life cycle. */
export type LegacyRedemptionBundleStatus = "created" | "validated" | "published" | "retired";

/** A legacy redemption bundle. Its code is unique within a tenant. */
export class LegacyRedemptionBundle {
  code: string;
  label: string;
  retries: number;
  reviewer: string;
  unit: string;
  status: LegacyRedemptionBundleStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    reviewer: string,
    unit: string,
    status: LegacyRedemptionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.reviewer = reviewer;
    this.unit = unit;
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

  canMoveTo(next: LegacyRedemptionBundleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyRedemptionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy redemption bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): LegacyRedemptionBundle {
    return new LegacyRedemptionBundle(this.code, this.label, this.retries, this.reviewer, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a legacy redemption bundle in status created. */
export function newLegacyRedemptionBundle(code: string, label: string): LegacyRedemptionBundle {
  return new LegacyRedemptionBundle(code, label, 0, "", "", "created");
}
