import * as text from "../../../../kit/text.js";

/** Where a proof slot is in its life cycle. */
export type ProofSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A proof slot. Its code is unique within a tenant. */
export class ProofSlot {
  code: string;
  title: string;
  currency: string;
  openRate: number;
  capacity: number;
  journeyId: string;
  createdAt: number;
  conversionRate: number;
  startsAt: number;
  status: ProofSlotStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    openRate: number,
    capacity: number,
    journeyId: string,
    createdAt: number,
    conversionRate: number,
    startsAt: number,
    status: ProofSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.openRate = openRate;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ProofSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"proof slot"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.capacity * this.createdAt * 100) / 100;
  }

  copy(): ProofSlot {
    return new ProofSlot(
      this.code,
      this.title,
      this.currency,
      this.openRate,
      this.capacity,
      this.journeyId,
      this.createdAt,
      this.conversionRate,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof slot in status planned. */
export function newProofSlot(code: string, title: string): ProofSlot {
  return new ProofSlot(code, title, "", 0, 0, "", 0, 0, 0, "planned");
}
