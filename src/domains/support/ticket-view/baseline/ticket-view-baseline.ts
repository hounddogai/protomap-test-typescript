/**
 * The ticket view baseline records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a ticket view baseline is in its life cycle. */
export type TicketViewBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** One ticket view baseline, with what the planners need to act on it. */
export class TicketViewBaseline {
  code: string;
  name: string;
  cost: number;
  sendAt: number;
  utmSource: string;
  label: string;
  bid: number;
  createdAt: number;
  status: TicketViewBaselineStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    sendAt: number,
    utmSource: string,
    label: string,
    bid: number,
    createdAt: number,
    status: TicketViewBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.label = label;
    this.bid = bid;
    this.createdAt = createdAt;
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

  canMoveTo(next: TicketViewBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TicketViewBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round((this.createdAt + this.sendAt) * 100) / 100;
  }

  copy(): TicketViewBaseline {
    return new TicketViewBaseline(
      this.code,
      this.name,
      this.cost,
      this.sendAt,
      this.utmSource,
      this.label,
      this.bid,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a ticket view baseline in status requested. */
export function newTicketViewBaseline(code: string, name: string): TicketViewBaseline {
  return new TicketViewBaseline(code, name, 0, 0, "", "", 0, 0, "requested");
}
