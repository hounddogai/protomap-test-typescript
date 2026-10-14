/**
 * The legacy fraud check claim records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy fraud check claim is in its life cycle. */
export type LegacyFraudCheckClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** One legacy fraud check claim, with what the planners need to act on it. */
export class LegacyFraudCheckClaim {
  code: string;
  label: string;
  summary: string;
  floorValue: number;
  frequencyCap: number;
  quantity: number;
  variant: string;
  margin: number;
  status: LegacyFraudCheckClaimStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    floorValue: number,
    frequencyCap: number,
    quantity: number,
    variant: string,
    margin: number,
    status: LegacyFraudCheckClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.variant = variant;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyFraudCheckClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyFraudCheckClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy fraud check claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round((this.frequencyCap - this.floorValue) * 100) / 100;
  }

  copy(): LegacyFraudCheckClaim {
    return new LegacyFraudCheckClaim(
      this.code,
      this.label,
      this.summary,
      this.floorValue,
      this.frequencyCap,
      this.quantity,
      this.variant,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy fraud check claim in status new. */
export function newLegacyFraudCheckClaim(code: string, label: string): LegacyFraudCheckClaim {
  return new LegacyFraudCheckClaim(code, label, "", 0, 0, 0, "", 0, "new");
}
