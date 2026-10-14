import * as text from "../../../../kit/text.js";

/** Where a fallback csat quota is in its life cycle. */
export type FallbackCsatQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback csat quota. Its code is unique within a tenant. */
export class FallbackCsatQuota {
  code: string;
  title: string;
  maximum: number;
  amount: number;
  sequence: number;
  startsAt: number;
  reviewer: string;
  frequencyCap: number;
  quantity: number;
  capacity: number;
  status: FallbackCsatQuotaStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    amount: number,
    sequence: number,
    startsAt: number,
    reviewer: string,
    frequencyCap: number,
    quantity: number,
    capacity: number,
    status: FallbackCsatQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.amount = amount;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.capacity = capacity;
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

  canMoveTo(next: FallbackCsatQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackCsatQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback csat quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedLoad(): number {
    return Math.round(this.capacity * this.startsAt * 100) / 100;
  }

  copy(): FallbackCsatQuota {
    return new FallbackCsatQuota(
      this.code,
      this.title,
      this.maximum,
      this.amount,
      this.sequence,
      this.startsAt,
      this.reviewer,
      this.frequencyCap,
      this.quantity,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback csat quota in status planned. */
export function newFallbackCsatQuota(code: string, title: string): FallbackCsatQuota {
  return new FallbackCsatQuota(code, title, 0, 0, 0, 0, "", 0, 0, 0, "planned");
}
