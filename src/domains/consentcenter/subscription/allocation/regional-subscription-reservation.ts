import * as text from "../../../../kit/text.js";

/** Where a regional subscription reservation is in its life cycle. */
export type RegionalSubscriptionReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional subscription reservation. Its code is unique within a tenant. */
export class RegionalSubscriptionReservation {
  code: string;
  title: string;
  sequence: number;
  openRate: number;
  bid: number;
  threshold: number;
  summary: string;
  budget: number;
  amount: number;
  createdAt: number;
  reviewer: string;
  status: RegionalSubscriptionReservationStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    openRate: number,
    bid: number,
    threshold: number,
    summary: string,
    budget: number,
    amount: number,
    createdAt: number,
    reviewer: string,
    status: RegionalSubscriptionReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.openRate = openRate;
    this.bid = bid;
    this.threshold = threshold;
    this.summary = summary;
    this.budget = budget;
    this.amount = amount;
    this.createdAt = createdAt;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalSubscriptionReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalSubscriptionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional subscription reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round((this.sequence + this.openRate) * 100) / 100;
  }

  copy(): RegionalSubscriptionReservation {
    return new RegionalSubscriptionReservation(
      this.code,
      this.title,
      this.sequence,
      this.openRate,
      this.bid,
      this.threshold,
      this.summary,
      this.budget,
      this.amount,
      this.createdAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional subscription reservation in status open. */
export function newRegionalSubscriptionReservation(code: string, title: string): RegionalSubscriptionReservation {
  return new RegionalSubscriptionReservation(code, title, 0, 0, 0, 0, "", 0, 0, 0, "", "open");
}
