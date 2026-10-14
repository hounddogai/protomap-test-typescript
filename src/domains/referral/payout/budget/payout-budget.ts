/**
 * The payout budget records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout budget is in its life cycle. */
export type PayoutBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a payout budget and its current status. */
export class PayoutBudget {
  code: string;
  name: string;
  campaignRef: string;
  region: string;
  visible: boolean;
  frequencyCap: number;
  status: PayoutBudgetStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    region: string,
    visible: boolean,
    frequencyCap: number,
    status: PayoutBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.region = region;
    this.visible = visible;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PayoutBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): PayoutBudget {
    return new PayoutBudget(
      this.code,
      this.name,
      this.campaignRef,
      this.region,
      this.visible,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a payout budget in status idle. */
export function newPayoutBudget(code: string, name: string): PayoutBudget {
  return new PayoutBudget(code, name, "", "", false, 0, "idle");
}
