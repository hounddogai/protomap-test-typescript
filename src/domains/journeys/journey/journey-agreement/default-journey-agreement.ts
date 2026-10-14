/**
 * The default journey agreement records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default journey agreement is in its life cycle. */
export type DefaultJourneyAgreementStatus = "created" | "validated" | "published" | "retired";

/** A default journey agreement. Its code is unique within a tenant. */
export class DefaultJourneyAgreement {
  code: string;
  name: string;
  amount: number;
  weight: number;
  priority: number;
  channel: string;
  budget: number;
  durationMinutes: number;
  createdAt: number;
  status: DefaultJourneyAgreementStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    weight: number,
    priority: number,
    channel: string,
    budget: number,
    durationMinutes: number,
    createdAt: number,
    status: DefaultJourneyAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.weight = weight;
    this.priority = priority;
    this.channel = channel;
    this.budget = budget;
    this.durationMinutes = durationMinutes;
    this.createdAt = createdAt;
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

  canMoveTo(next: DefaultJourneyAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultJourneyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default journey agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netTotal(): number {
    return Math.round(this.amount * this.createdAt * 100) / 100;
  }

  copy(): DefaultJourneyAgreement {
    return new DefaultJourneyAgreement(
      this.code,
      this.name,
      this.amount,
      this.weight,
      this.priority,
      this.channel,
      this.budget,
      this.durationMinutes,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default journey agreement in status created. */
export function newDefaultJourneyAgreement(code: string, name: string): DefaultJourneyAgreement {
  return new DefaultJourneyAgreement(code, name, 0, 0, 0, "", 0, 0, 0, "created");
}
