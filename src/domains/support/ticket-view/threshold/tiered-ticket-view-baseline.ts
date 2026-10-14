import * as text from "../../../../kit/text.js";

/** Where a tiered ticket view baseline is in its life cycle. */
export type TieredTicketViewBaselineStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered ticket view baseline and its current status. */
export class TieredTicketViewBaseline {
  code: string;
  name: string;
  rate: number;
  endsAt: number;
  journeyId: string;
  budget: number;
  amount: number;
  title: string;
  bid: number;
  externalRef: string;
  status: TieredTicketViewBaselineStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    endsAt: number,
    journeyId: string,
    budget: number,
    amount: number,
    title: string,
    bid: number,
    externalRef: string,
    status: TieredTicketViewBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.endsAt = endsAt;
    this.journeyId = journeyId;
    this.budget = budget;
    this.amount = amount;
    this.title = title;
    this.bid = bid;
    this.externalRef = externalRef;
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

  canMoveTo(next: TieredTicketViewBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredTicketViewBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered ticket view baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round(this.endsAt * this.budget * 100) / 100;
  }

  copy(): TieredTicketViewBaseline {
    return new TieredTicketViewBaseline(
      this.code,
      this.name,
      this.rate,
      this.endsAt,
      this.journeyId,
      this.budget,
      this.amount,
      this.title,
      this.bid,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered ticket view baseline in status created. */
export function newTieredTicketViewBaseline(code: string, name: string): TieredTicketViewBaseline {
  return new TieredTicketViewBaseline(code, name, 0, 0, "", 0, 0, "", 0, "", "created");
}
