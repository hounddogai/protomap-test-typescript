/**
 * The ticket view quota records of support's ticket view work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view quota is in its life cycle. */
export type TicketViewQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a ticket view quota and its current status. */
export class TicketViewQuota {
  code: string;
  name: string;
  budget: number;
  amount: number;
  expiresAt: number;
  currency: string;
  frequencyCap: number;
  status: TicketViewQuotaStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    amount: number,
    expiresAt: number,
    currency: string,
    frequencyCap: number,
    status: TicketViewQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.amount = amount;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: TicketViewQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"ticket view quota"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.budget * this.amount * 100) / 100;
  }

  copy(): TicketViewQuota {
    return new TicketViewQuota(
      this.code,
      this.name,
      this.budget,
      this.amount,
      this.expiresAt,
      this.currency,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a ticket view quota in status requested. */
export function newTicketViewQuota(code: string, name: string): TicketViewQuota {
  return new TicketViewQuota(code, name, 0, 0, 0, "", 0, "requested");
}
