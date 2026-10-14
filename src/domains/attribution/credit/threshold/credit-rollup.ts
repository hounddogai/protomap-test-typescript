import * as text from "../../../../kit/text.js";

/** Where a credit rollup is in its life cycle. */
export type CreditRollupStatus = "created" | "validated" | "published" | "retired";

/** A credit rollup. Its code is unique within a tenant. */
export class CreditRollup {
  code: string;
  title: string;
  cohort: string;
  reviewer: string;
  checksum: string;
  category: string;
  threshold: number;
  impressions: number;
  bid: number;
  notes: string;
  status: CreditRollupStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    reviewer: string,
    checksum: string,
    category: string,
    threshold: number,
    impressions: number,
    bid: number,
    notes: string,
    status: CreditRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.category = category;
    this.threshold = threshold;
    this.impressions = impressions;
    this.bid = bid;
    this.notes = notes;
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

  canMoveTo(next: CreditRollupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.threshold - this.impressions) * 100) / 100;
  }

  copy(): CreditRollup {
    return new CreditRollup(
      this.code,
      this.title,
      this.cohort,
      this.reviewer,
      this.checksum,
      this.category,
      this.threshold,
      this.impressions,
      this.bid,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a credit rollup in status created. */
export function newCreditRollup(code: string, title: string): CreditRollup {
  return new CreditRollup(code, title, "", "", "", "", 0, 0, 0, "", "created");
}
