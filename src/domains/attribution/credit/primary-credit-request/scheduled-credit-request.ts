/**
 * The scheduled credit request records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled credit request is in its life cycle. */
export type ScheduledCreditRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One scheduled credit request, with what the planners need to act on it. */
export class ScheduledCreditRequest {
  code: string;
  name: string;
  maximum: number;
  checksum: string;
  quantity: number;
  status: ScheduledCreditRequestStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    checksum: string,
    quantity: number,
    status: ScheduledCreditRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.checksum = checksum;
    this.quantity = quantity;
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

  canMoveTo(next: ScheduledCreditRequestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "failed";
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

  moveTo(next: ScheduledCreditRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled credit request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.quantity * this.maximum * 100) / 100;
  }

  copy(): ScheduledCreditRequest {
    return new ScheduledCreditRequest(this.code, this.name, this.maximum, this.checksum, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled credit request in status new. */
export function newScheduledCreditRequest(code: string, name: string): ScheduledCreditRequest {
  return new ScheduledCreditRequest(code, name, 0, "", 0, "new");
}
