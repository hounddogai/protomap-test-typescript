/**
 * The legacy reputation digest records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy reputation digest is in its life cycle. */
export type LegacyReputationDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a legacy reputation digest and its current status. */
export class LegacyReputationDigest {
  code: string;
  label: string;
  bid: number;
  externalRef: string;
  approved: boolean;
  status: LegacyReputationDigestStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    externalRef: string,
    approved: boolean,
    status: LegacyReputationDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.externalRef = externalRef;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyReputationDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyReputationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reputation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): LegacyReputationDigest {
    return new LegacyReputationDigest(this.code, this.label, this.bid, this.externalRef, this.approved, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy reputation digest in status open. */
export function newLegacyReputationDigest(code: string, label: string): LegacyReputationDigest {
  return new LegacyReputationDigest(code, label, 0, "", false, "open");
}
