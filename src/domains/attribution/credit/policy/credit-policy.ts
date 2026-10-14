/**
 * The credit policy records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit policy is in its life cycle. */
export type CreditPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a credit policy and its current status. */
export class CreditPolicy {
  code: string;
  name: string;
  ratio: number;
  tags: string[];
  pinned: boolean;
  clicks: number;
  status: CreditPolicyStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    tags: string[],
    pinned: boolean,
    clicks: number,
    status: CreditPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.tags = tags;
    this.pinned = pinned;
    this.clicks = clicks;
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

  canMoveTo(next: CreditPolicyStatus): boolean {
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreditPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"credit policy"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round(this.clicks * this.ratio * 100) / 100;
  }

  copy(): CreditPolicy {
    return new CreditPolicy(this.code, this.name, this.ratio, this.tags, this.pinned, this.clicks, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a credit policy in status requested. */
export function newCreditPolicy(code: string, name: string): CreditPolicy {
  return new CreditPolicy(code, name, 0, [], false, 0, "requested");
}
