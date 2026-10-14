import * as text from "../../../../kit/text.js";

/** Where a batched sender rollup is in its life cycle. */
export type BatchedSenderRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched sender rollup. Its code is unique within a tenant. */
export class BatchedSenderRollup {
  code: string;
  label: string;
  currency: string;
  contactEmail: string;
  ceiling: number;
  locale: string;
  externalRef: string;
  budget: number;
  limit: number;
  sequence: number;
  weight: number;
  status: BatchedSenderRollupStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    contactEmail: string,
    ceiling: number,
    locale: string,
    externalRef: string,
    budget: number,
    limit: number,
    sequence: number,
    weight: number,
    status: BatchedSenderRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.ceiling = ceiling;
    this.locale = locale;
    this.externalRef = externalRef;
    this.budget = budget;
    this.limit = limit;
    this.sequence = sequence;
    this.weight = weight;
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

  canMoveTo(next: BatchedSenderRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
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

  moveTo(next: BatchedSenderRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched sender rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched sender rollup"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.ceiling + this.limit) * 100) / 100;
  }

  copy(): BatchedSenderRollup {
    return new BatchedSenderRollup(
      this.code,
      this.label,
      this.currency,
      this.contactEmail,
      this.ceiling,
      this.locale,
      this.externalRef,
      this.budget,
      this.limit,
      this.sequence,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched sender rollup in status planned. */
export function newBatchedSenderRollup(code: string, label: string): BatchedSenderRollup {
  return new BatchedSenderRollup(code, label, "", "", 0, "", "", 0, 0, 0, 0, "planned");
}
