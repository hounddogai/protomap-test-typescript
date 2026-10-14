/**
 * The global wait policy records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global wait policy is in its life cycle. */
export type GlobalWaitPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global wait policy as the wait team keeps it. */
export class GlobalWaitPolicy {
  code: string;
  label: string;
  retries: number;
  phone: string;
  visible: boolean;
  segment: string;
  batchSize: number;
  cost: number;
  status: GlobalWaitPolicyStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    phone: string,
    visible: boolean,
    segment: string,
    batchSize: number,
    cost: number,
    status: GlobalWaitPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.phone = phone;
    this.visible = visible;
    this.segment = segment;
    this.batchSize = batchSize;
    this.cost = cost;
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

  canMoveTo(next: GlobalWaitPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
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

  moveTo(next: GlobalWaitPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global wait policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.batchSize - this.cost) * 100) / 100;
  }

  copy(): GlobalWaitPolicy {
    return new GlobalWaitPolicy(
      this.code,
      this.label,
      this.retries,
      this.phone,
      this.visible,
      this.segment,
      this.batchSize,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global wait policy in status draft. */
export function newGlobalWaitPolicy(code: string, label: string): GlobalWaitPolicy {
  return new GlobalWaitPolicy(code, label, 0, "", false, "", 0, 0, "draft");
}
