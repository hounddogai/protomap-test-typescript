import * as text from "../../../../kit/text.js";

/** Where a batched fraud check reservation is in its life cycle. */
export type BatchedFraudCheckReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a batched fraud check reservation and its current status. */
export class BatchedFraudCheckReservation {
  code: string;
  title: string;
  source: string;
  cohort: string;
  active: boolean;
  description: string;
  sendAt: number;
  batchSize: number;
  status: BatchedFraudCheckReservationStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    cohort: string,
    active: boolean,
    description: string,
    sendAt: number,
    batchSize: number,
    status: BatchedFraudCheckReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.cohort = cohort;
    this.active = active;
    this.description = description;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
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

  canMoveTo(next: BatchedFraudCheckReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedFraudCheckReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched fraud check reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveValue(): number {
    return Math.round((this.batchSize - this.sendAt) * 100) / 100;
  }

  copy(): BatchedFraudCheckReservation {
    return new BatchedFraudCheckReservation(
      this.code,
      this.title,
      this.source,
      this.cohort,
      this.active,
      this.description,
      this.sendAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched fraud check reservation in status open. */
export function newBatchedFraudCheckReservation(code: string, title: string): BatchedFraudCheckReservation {
  return new BatchedFraudCheckReservation(code, title, "", "", false, "", 0, 0, "open");
}
