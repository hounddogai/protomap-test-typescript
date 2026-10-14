import * as text from "../../../../kit/text.js";

/** Where a domain reservation is in its life cycle. */
export type DomainReservationStatus = "created" | "validated" | "published" | "retired";

/** One domain reservation, with what the planners need to act on it. */
export class DomainReservation {
  code: string;
  name: string;
  budget: number;
  durationMinutes: number;
  amount: number;
  summary: string;
  currency: string;
  audienceId: string;
  priority: number;
  bid: number;
  discount: number;
  status: DomainReservationStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    durationMinutes: number,
    amount: number,
    summary: string,
    currency: string,
    audienceId: string,
    priority: number,
    bid: number,
    discount: number,
    status: DomainReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.durationMinutes = durationMinutes;
    this.amount = amount;
    this.summary = summary;
    this.currency = currency;
    this.audienceId = audienceId;
    this.priority = priority;
    this.bid = bid;
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

  canMoveTo(next: DomainReservationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DomainReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round(this.durationMinutes * this.discount * 100) / 100;
  }

  copy(): DomainReservation {
    return new DomainReservation(
      this.code,
      this.name,
      this.budget,
      this.durationMinutes,
      this.amount,
      this.summary,
      this.currency,
      this.audienceId,
      this.priority,
      this.bid,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a domain reservation in status created. */
export function newDomainReservation(code: string, name: string): DomainReservation {
  return new DomainReservation(code, name, 0, 0, 0, "", "", "", 0, 0, 0, "created");
}
