import * as text from "../../../../kit/text.js";

/** Where a payout record is in its life cycle. */
export type PayoutRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A payout record. Its code is unique within a tenant. */
export class PayoutRecord {
  code: string;
  title: string;
  frequencyCap: number;
  batchSize: number;
  timezone: string;
  category: string;
  externalRef: string;
  conversionRate: number;
  status: PayoutRecordStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    batchSize: number,
    timezone: string,
    category: string,
    externalRef: string,
    conversionRate: number,
    status: PayoutRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
    this.timezone = timezone;
    this.category = category;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: PayoutRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PayoutRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"payout record"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.frequencyCap + this.batchSize) * 100) / 100;
  }

  copy(): PayoutRecord {
    return new PayoutRecord(
      this.code,
      this.title,
      this.frequencyCap,
      this.batchSize,
      this.timezone,
      this.category,
      this.externalRef,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a payout record in status planned. */
export function newPayoutRecord(code: string, title: string): PayoutRecord {
  return new PayoutRecord(code, title, 0, 0, "", "", "", 0, "planned");
}
