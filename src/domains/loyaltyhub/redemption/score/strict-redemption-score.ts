/**
 * The strict redemption score records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict redemption score is in its life cycle. */
export type StrictRedemptionScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict redemption score, with what the planners need to act on it. */
export class StrictRedemptionScore {
  code: string;
  label: string;
  category: string;
  ownerId: string;
  sequence: number;
  graceDays: number;
  status: StrictRedemptionScoreStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    ownerId: string,
    sequence: number,
    graceDays: number,
    status: StrictRedemptionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.ownerId = ownerId;
    this.sequence = sequence;
    this.graceDays = graceDays;
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

  canMoveTo(next: StrictRedemptionScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: StrictRedemptionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict redemption score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.graceDays * this.sequence * 100) / 100;
  }

  copy(): StrictRedemptionScore {
    return new StrictRedemptionScore(
      this.code,
      this.label,
      this.category,
      this.ownerId,
      this.sequence,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict redemption score in status requested. */
export function newStrictRedemptionScore(code: string, label: string): StrictRedemptionScore {
  return new StrictRedemptionScore(code, label, "", "", 0, 0, "requested");
}
