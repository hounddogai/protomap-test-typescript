import * as text from "../../../../kit/text.js";

/** Where a batched deflection reservation is in its life cycle. */
export type BatchedDeflectionReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a batched deflection reservation and its current status. */
export class BatchedDeflectionReservation {
  code: string;
  label: string;
  frequencyCap: number;
  windowDays: number;
  batchSize: number;
  score: number;
  archived: boolean;
  status: BatchedDeflectionReservationStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    windowDays: number,
    batchSize: number,
    score: number,
    archived: boolean,
    status: BatchedDeflectionReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.score = score;
    this.archived = archived;
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

  canMoveTo(next: BatchedDeflectionReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedDeflectionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched deflection reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"batched deflection reservation"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.windowDays * this.batchSize * 100) / 100;
  }

  copy(): BatchedDeflectionReservation {
    return new BatchedDeflectionReservation(
      this.code,
      this.label,
      this.frequencyCap,
      this.windowDays,
      this.batchSize,
      this.score,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched deflection reservation in status open. */
export function newBatchedDeflectionReservation(code: string, label: string): BatchedDeflectionReservation {
  return new BatchedDeflectionReservation(code, label, 0, 0, 0, 0, false, "open");
}
