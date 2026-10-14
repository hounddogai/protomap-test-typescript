import * as text from "../../../../kit/text.js";

/** Where a capped credit segment is in its life cycle. */
export type CappedCreditSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A capped credit segment as the credit team keeps it. */
export class CappedCreditSegment {
  code: string;
  title: string;
  batchSize: number;
  ceiling: number;
  durationMinutes: number;
  limit: number;
  checksum: string;
  budget: number;
  discount: number;
  status: CappedCreditSegmentStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    ceiling: number,
    durationMinutes: number,
    limit: number,
    checksum: string,
    budget: number,
    discount: number,
    status: CappedCreditSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.durationMinutes = durationMinutes;
    this.limit = limit;
    this.checksum = checksum;
    this.budget = budget;
    this.discount = discount;
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

  canMoveTo(next: CappedCreditSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedCreditSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped credit segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.budget - this.batchSize) * 100) / 100;
  }

  copy(): CappedCreditSegment {
    return new CappedCreditSegment(
      this.code,
      this.title,
      this.batchSize,
      this.ceiling,
      this.durationMinutes,
      this.limit,
      this.checksum,
      this.budget,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped credit segment in status draft. */
export function newCappedCreditSegment(code: string, title: string): CappedCreditSegment {
  return new CappedCreditSegment(code, title, 0, 0, 0, 0, "", 0, 0, "draft");
}
