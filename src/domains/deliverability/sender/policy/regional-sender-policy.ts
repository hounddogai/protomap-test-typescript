/**
 * The regional sender policy records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional sender policy is in its life cycle. */
export type RegionalSenderPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a regional sender policy and its current status. */
export class RegionalSenderPolicy {
  code: string;
  label: string;
  retries: number;
  ratio: number;
  category: string;
  sequence: number;
  pinned: boolean;
  cost: number;
  status: RegionalSenderPolicyStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    ratio: number,
    category: string,
    sequence: number,
    pinned: boolean,
    cost: number,
    status: RegionalSenderPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.ratio = ratio;
    this.category = category;
    this.sequence = sequence;
    this.pinned = pinned;
    this.cost = cost;
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

  canMoveTo(next: RegionalSenderPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalSenderPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sender policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.sequence * this.cost * 100) / 100;
  }

  copy(): RegionalSenderPolicy {
    return new RegionalSenderPolicy(
      this.code,
      this.label,
      this.retries,
      this.ratio,
      this.category,
      this.sequence,
      this.pinned,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional sender policy in status proposed. */
export function newRegionalSenderPolicy(code: string, label: string): RegionalSenderPolicy {
  return new RegionalSenderPolicy(code, label, 0, 0, "", 0, false, 0, "proposed");
}
