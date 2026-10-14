import * as text from "../../../../kit/text.js";

/** Where a ticket view claim is in its life cycle. */
export type TicketViewClaimStatus = "created" | "validated" | "published" | "retired";

/** The record of a ticket view claim and its current status. */
export class TicketViewClaim {
  code: string;
  name: string;
  updatedAt: number;
  label: string;
  journeyId: string;
  currency: string;
  batchSize: number;
  status: TicketViewClaimStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    label: string,
    journeyId: string,
    currency: string,
    batchSize: number,
    status: TicketViewClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.label = label;
    this.journeyId = journeyId;
    this.currency = currency;
    this.batchSize = batchSize;
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

  canMoveTo(next: TicketViewClaimStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TicketViewClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  netValue(): number {
    return Math.round((this.updatedAt + this.batchSize) * 100) / 100;
  }

  copy(): TicketViewClaim {
    return new TicketViewClaim(
      this.code,
      this.name,
      this.updatedAt,
      this.label,
      this.journeyId,
      this.currency,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a ticket view claim in status created. */
export function newTicketViewClaim(code: string, name: string): TicketViewClaim {
  return new TicketViewClaim(code, name, 0, "", "", "", 0, "created");
}
