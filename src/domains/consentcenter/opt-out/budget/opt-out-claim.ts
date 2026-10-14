import * as text from "../../../../kit/text.js";

/** Where a opt out claim is in its life cycle. */
export type OptOutClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a opt out claim and its current status. */
export class OptOutClaim {
  code: string;
  name: string;
  category: string;
  utmSource: string;
  externalRef: string;
  journeyId: string;
  weight: number;
  amount: number;
  startsAt: number;
  currency: string;
  title: string;
  status: OptOutClaimStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    utmSource: string,
    externalRef: string,
    journeyId: string,
    weight: number,
    amount: number,
    startsAt: number,
    currency: string,
    title: string,
    status: OptOutClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.utmSource = utmSource;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.weight = weight;
    this.amount = amount;
    this.startsAt = startsAt;
    this.currency = currency;
    this.title = title;
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

  canMoveTo(next: OptOutClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: OptOutClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"opt out claim"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.weight + this.startsAt) * 100) / 100;
  }

  copy(): OptOutClaim {
    return new OptOutClaim(
      this.code,
      this.name,
      this.category,
      this.utmSource,
      this.externalRef,
      this.journeyId,
      this.weight,
      this.amount,
      this.startsAt,
      this.currency,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a opt out claim in status planned. */
export function newOptOutClaim(code: string, name: string): OptOutClaim {
  return new OptOutClaim(code, name, "", "", "", "", 0, 0, 0, "", "", "planned");
}
