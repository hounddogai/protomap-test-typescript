import * as text from "../../../../kit/text.js";

/** Where a batched conversion reservation is in its life cycle. */
export type BatchedConversionReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** One batched conversion reservation, with what the planners need to act on it. */
export class BatchedConversionReservation {
  code: string;
  title: string;
  floorValue: number;
  sequence: number;
  utmSource: string;
  description: string;
  batchSize: number;
  archived: boolean;
  retries: number;
  amount: number;
  bid: number;
  status: BatchedConversionReservationStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    sequence: number,
    utmSource: string,
    description: string,
    batchSize: number,
    archived: boolean,
    retries: number,
    amount: number,
    bid: number,
    status: BatchedConversionReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.description = description;
    this.batchSize = batchSize;
    this.archived = archived;
    this.retries = retries;
    this.amount = amount;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedConversionReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedConversionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched conversion reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.sequence - this.amount) * 100) / 100;
  }

  copy(): BatchedConversionReservation {
    return new BatchedConversionReservation(
      this.code,
      this.title,
      this.floorValue,
      this.sequence,
      this.utmSource,
      this.description,
      this.batchSize,
      this.archived,
      this.retries,
      this.amount,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched conversion reservation in status requested. */
export function newBatchedConversionReservation(code: string, title: string): BatchedConversionReservation {
  return new BatchedConversionReservation(code, title, 0, 0, "", "", 0, false, 0, 0, 0, "requested");
}
