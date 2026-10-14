/**
 * The capped fraud check claim records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped fraud check claim is in its life cycle. */
export type CappedFraudCheckClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped fraud check claim, with what the planners need to act on it. */
export class CappedFraudCheckClaim {
  code: string;
  title: string;
  tags: string[];
  pinned: boolean;
  priority: number;
  region: string;
  status: CappedFraudCheckClaimStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    pinned: boolean,
    priority: number,
    region: string,
    status: CappedFraudCheckClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.pinned = pinned;
    this.priority = priority;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFraudCheckClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedFraudCheckClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped fraud check claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): CappedFraudCheckClaim {
    return new CappedFraudCheckClaim(
      this.code,
      this.title,
      this.tags,
      this.pinned,
      this.priority,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped fraud check claim in status proposed. */
export function newCappedFraudCheckClaim(code: string, title: string): CappedFraudCheckClaim {
  return new CappedFraudCheckClaim(code, title, [], false, 0, "", "proposed");
}
