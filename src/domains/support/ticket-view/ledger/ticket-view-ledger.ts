/**
 * The ticket view ledger records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view ledger is in its life cycle. */
export type TicketViewLedgerStatus = "created" | "validated" | "published" | "retired";

/** A ticket view ledger. Its code is unique within a tenant. */
export class TicketViewLedger {
  code: string;
  name: string;
  openRate: number;
  clicks: number;
  windowDays: number;
  floorValue: number;
  weight: number;
  ownerId: string;
  channel: string;
  retries: number;
  status: TicketViewLedgerStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    clicks: number,
    windowDays: number,
    floorValue: number,
    weight: number,
    ownerId: string,
    channel: string,
    retries: number,
    status: TicketViewLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.clicks = clicks;
    this.windowDays = windowDays;
    this.floorValue = floorValue;
    this.weight = weight;
    this.ownerId = ownerId;
    this.channel = channel;
    this.retries = retries;
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

  canMoveTo(next: TicketViewLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TicketViewLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round((this.openRate + this.weight) * 100) / 100;
  }

  copy(): TicketViewLedger {
    return new TicketViewLedger(
      this.code,
      this.name,
      this.openRate,
      this.clicks,
      this.windowDays,
      this.floorValue,
      this.weight,
      this.ownerId,
      this.channel,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a ticket view ledger in status created. */
export function newTicketViewLedger(code: string, name: string): TicketViewLedger {
  return new TicketViewLedger(code, name, 0, 0, 0, 0, 0, "", "", 0, "created");
}
