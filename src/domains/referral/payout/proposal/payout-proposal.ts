/**
 * The payout proposal records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout proposal is in its life cycle. */
export type PayoutProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One payout proposal, with what the planners need to act on it. */
export class PayoutProposal {
  code: string;
  name: string;
  quantity: number;
  expiresAt: number;
  limit: number;
  amount: number;
  margin: number;
  phone: string;
  locale: string;
  budget: number;
  discount: number;
  status: PayoutProposalStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    expiresAt: number,
    limit: number,
    amount: number,
    margin: number,
    phone: string,
    locale: string,
    budget: number,
    discount: number,
    status: PayoutProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.expiresAt = expiresAt;
    this.limit = limit;
    this.amount = amount;
    this.margin = margin;
    this.phone = phone;
    this.locale = locale;
    this.budget = budget;
    this.discount = discount;
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

  canMoveTo(next: PayoutProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.amount + this.expiresAt) * 100) / 100;
  }

  copy(): PayoutProposal {
    return new PayoutProposal(
      this.code,
      this.name,
      this.quantity,
      this.expiresAt,
      this.limit,
      this.amount,
      this.margin,
      this.phone,
      this.locale,
      this.budget,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout proposal in status idle. */
export function newPayoutProposal(code: string, name: string): PayoutProposal {
  return new PayoutProposal(code, name, 0, 0, 0, 0, 0, "", "", 0, 0, "idle");
}
