import * as text from "../../../../kit/text.js";

/** Where a strict journey rollup is in its life cycle. */
export type StrictJourneyRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict journey rollup, with what the planners need to act on it. */
export class StrictJourneyRollup {
  code: string;
  label: string;
  revision: number;
  createdAt: number;
  region: string;
  budget: number;
  description: string;
  amount: number;
  bid: number;
  currency: string;
  status: StrictJourneyRollupStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    createdAt: number,
    region: string,
    budget: number,
    description: string,
    amount: number,
    bid: number,
    currency: string,
    status: StrictJourneyRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.createdAt = createdAt;
    this.region = region;
    this.budget = budget;
    this.description = description;
    this.amount = amount;
    this.bid = bid;
    this.currency = currency;
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

  canMoveTo(next: StrictJourneyRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictJourneyRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict journey rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.createdAt + this.budget) * 100) / 100;
  }

  copy(): StrictJourneyRollup {
    return new StrictJourneyRollup(
      this.code,
      this.label,
      this.revision,
      this.createdAt,
      this.region,
      this.budget,
      this.description,
      this.amount,
      this.bid,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict journey rollup in status requested. */
export function newStrictJourneyRollup(code: string, label: string): StrictJourneyRollup {
  return new StrictJourneyRollup(code, label, 0, 0, "", 0, "", 0, 0, "", "requested");
}
