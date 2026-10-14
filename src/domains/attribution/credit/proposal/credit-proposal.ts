/**
 * The credit proposal records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit proposal is in its life cycle. */
export type CreditProposalStatus = "created" | "validated" | "published" | "retired";

/** A credit proposal as the credit team keeps it. */
export class CreditProposal {
  code: string;
  name: string;
  floorValue: number;
  clicks: number;
  reviewer: string;
  durationMinutes: number;
  cost: number;
  discount: number;
  status: CreditProposalStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    clicks: number,
    reviewer: string,
    durationMinutes: number,
    cost: number,
    discount: number,
    status: CreditProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.cost = cost;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.discount + this.durationMinutes) * 100) / 100;
  }

  copy(): CreditProposal {
    return new CreditProposal(
      this.code,
      this.name,
      this.floorValue,
      this.clicks,
      this.reviewer,
      this.durationMinutes,
      this.cost,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a credit proposal in status created. */
export function newCreditProposal(code: string, name: string): CreditProposal {
  return new CreditProposal(code, name, 0, 0, "", 0, 0, 0, "created");
}
