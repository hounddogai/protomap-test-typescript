/**
 * The batched window reservation records of attribution's window work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched window reservation is in its life cycle. */
export type BatchedWindowReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched window reservation as the window team keeps it. */
export class BatchedWindowReservation {
  code: string;
  title: string;
  minimum: number;
  name: string;
  approved: boolean;
  startsAt: number;
  reviewer: string;
  quantity: number;
  status: BatchedWindowReservationStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    name: string,
    approved: boolean,
    startsAt: number,
    reviewer: string,
    quantity: number,
    status: BatchedWindowReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.name = name;
    this.approved = approved;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedWindowReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedWindowReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched window reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.minimum + this.startsAt) * 100) / 100;
  }

  copy(): BatchedWindowReservation {
    return new BatchedWindowReservation(
      this.code,
      this.title,
      this.minimum,
      this.name,
      this.approved,
      this.startsAt,
      this.reviewer,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched window reservation in status proposed. */
export function newBatchedWindowReservation(code: string, title: string): BatchedWindowReservation {
  return new BatchedWindowReservation(code, title, 0, "", false, 0, "", 0, "proposed");
}
