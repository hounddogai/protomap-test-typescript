/**
 * The primary macro quota records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary macro quota is in its life cycle. */
export type PrimaryMacroQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary macro quota and its current status. */
export class PrimaryMacroQuota {
  code: string;
  name: string;
  amount: number;
  graceDays: number;
  budget: number;
  ceiling: number;
  status: PrimaryMacroQuotaStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    graceDays: number,
    budget: number,
    ceiling: number,
    status: PrimaryMacroQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.graceDays = graceDays;
    this.budget = budget;
    this.ceiling = ceiling;
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

  canMoveTo(next: PrimaryMacroQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryMacroQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary macro quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.ceiling + this.budget) * 100) / 100;
  }

  copy(): PrimaryMacroQuota {
    return new PrimaryMacroQuota(
      this.code,
      this.name,
      this.amount,
      this.graceDays,
      this.budget,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary macro quota in status new. */
export function newPrimaryMacroQuota(code: string, name: string): PrimaryMacroQuota {
  return new PrimaryMacroQuota(code, name, 0, 0, 0, 0, "new");
}
