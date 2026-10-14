/**
 * The tiered ticket view claim records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered ticket view claim is in its life cycle. */
export type TieredTicketViewClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered ticket view claim. Its code is unique within a tenant. */
export class TieredTicketViewClaim {
  code: string;
  title: string;
  timezone: string;
  retries: number;
  bid: number;
  unit: string;
  locale: string;
  status: TieredTicketViewClaimStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    retries: number,
    bid: number,
    unit: string,
    locale: string,
    status: TieredTicketViewClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.retries = retries;
    this.bid = bid;
    this.unit = unit;
    this.locale = locale;
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

  canMoveTo(next: TieredTicketViewClaimStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredTicketViewClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered ticket view claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.bid - this.retries) * 100) / 100;
  }

  copy(): TieredTicketViewClaim {
    return new TieredTicketViewClaim(
      this.code,
      this.title,
      this.timezone,
      this.retries,
      this.bid,
      this.unit,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered ticket view claim in status new. */
export function newTieredTicketViewClaim(code: string, title: string): TieredTicketViewClaim {
  return new TieredTicketViewClaim(code, title, "", 0, 0, "", "", "new");
}
