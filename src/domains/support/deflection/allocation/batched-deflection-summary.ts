import * as text from "../../../../kit/text.js";

/** Where a batched deflection summary is in its life cycle. */
export type BatchedDeflectionSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched deflection summary as the deflection team keeps it. */
export class BatchedDeflectionSummary {
  code: string;
  title: string;
  rate: number;
  contactEmail: string;
  amount: number;
  createdAt: number;
  name: string;
  active: boolean;
  segment: string;
  variant: string;
  budget: number;
  status: BatchedDeflectionSummaryStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    contactEmail: string,
    amount: number,
    createdAt: number,
    name: string,
    active: boolean,
    segment: string,
    variant: string,
    budget: number,
    status: BatchedDeflectionSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.createdAt = createdAt;
    this.name = name;
    this.active = active;
    this.segment = segment;
    this.variant = variant;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedDeflectionSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedDeflectionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched deflection summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round(this.amount * this.createdAt * 100) / 100;
  }

  copy(): BatchedDeflectionSummary {
    return new BatchedDeflectionSummary(
      this.code,
      this.title,
      this.rate,
      this.contactEmail,
      this.amount,
      this.createdAt,
      this.name,
      this.active,
      this.segment,
      this.variant,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched deflection summary in status draft. */
export function newBatchedDeflectionSummary(code: string, title: string): BatchedDeflectionSummary {
  return new BatchedDeflectionSummary(code, title, 0, "", 0, 0, "", false, "", "", 0, "draft");
}
