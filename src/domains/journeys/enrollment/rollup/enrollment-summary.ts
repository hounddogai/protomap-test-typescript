import * as text from "../../../../kit/text.js";

/** Where a enrollment summary is in its life cycle. */
export type EnrollmentSummaryStatus = "created" | "validated" | "published" | "retired";

/** A enrollment summary as the enrollment team keeps it. */
export class EnrollmentSummary {
  code: string;
  title: string;
  createdAt: number;
  externalRef: string;
  cost: number;
  capacity: number;
  channel: string;
  checksum: string;
  floorValue: number;
  quantity: number;
  status: EnrollmentSummaryStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    externalRef: string,
    cost: number,
    capacity: number,
    channel: string,
    checksum: string,
    floorValue: number,
    quantity: number,
    status: EnrollmentSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.cost = cost;
    this.capacity = capacity;
    this.channel = channel;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.quantity = quantity;
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

  canMoveTo(next: EnrollmentSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: EnrollmentSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"enrollment summary"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.quantity * this.createdAt * 100) / 100;
  }

  copy(): EnrollmentSummary {
    return new EnrollmentSummary(
      this.code,
      this.title,
      this.createdAt,
      this.externalRef,
      this.cost,
      this.capacity,
      this.channel,
      this.checksum,
      this.floorValue,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a enrollment summary in status created. */
export function newEnrollmentSummary(code: string, title: string): EnrollmentSummary {
  return new EnrollmentSummary(code, title, 0, "", 0, 0, "", "", 0, 0, "created");
}
