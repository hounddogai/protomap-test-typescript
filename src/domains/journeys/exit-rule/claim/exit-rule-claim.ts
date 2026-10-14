/**
 * The exit rule claim records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule claim is in its life cycle. */
export type ExitRuleClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A exit rule claim. Its code is unique within a tenant. */
export class ExitRuleClaim {
  code: string;
  name: string;
  sequence: number;
  minimum: number;
  description: string;
  retries: number;
  amount: number;
  status: ExitRuleClaimStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    minimum: number,
    description: string,
    retries: number,
    amount: number,
    status: ExitRuleClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.minimum = minimum;
    this.description = description;
    this.retries = retries;
    this.amount = amount;
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

  canMoveTo(next: ExitRuleClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ExitRuleClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.minimum + this.sequence) * 100) / 100;
  }

  copy(): ExitRuleClaim {
    return new ExitRuleClaim(
      this.code,
      this.name,
      this.sequence,
      this.minimum,
      this.description,
      this.retries,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a exit rule claim in status idle. */
export function newExitRuleClaim(code: string, name: string): ExitRuleClaim {
  return new ExitRuleClaim(code, name, 0, 0, "", 0, 0, "idle");
}
