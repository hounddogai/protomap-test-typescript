import * as text from "../../../../kit/text.js";

/** Where a batched warmup reservation is in its life cycle. */
export type BatchedWarmupReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a batched warmup reservation and its current status. */
export class BatchedWarmupReservation {
  code: string;
  label: string;
  expiresAt: number;
  campaignRef: string;
  unit: string;
  category: string;
  utmSource: string;
  status: BatchedWarmupReservationStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    campaignRef: string,
    unit: string,
    category: string,
    utmSource: string,
    status: BatchedWarmupReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.category = category;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedWarmupReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedWarmupReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched warmup reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): BatchedWarmupReservation {
    return new BatchedWarmupReservation(
      this.code,
      this.label,
      this.expiresAt,
      this.campaignRef,
      this.unit,
      this.category,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched warmup reservation in status new. */
export function newBatchedWarmupReservation(code: string, label: string): BatchedWarmupReservation {
  return new BatchedWarmupReservation(code, label, 0, "", "", "", "", "new");
}
