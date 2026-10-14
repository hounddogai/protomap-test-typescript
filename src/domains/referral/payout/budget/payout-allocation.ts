import * as text from "../../../../kit/text.js";

/** Where a payout allocation is in its life cycle. */
export type PayoutAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a payout allocation and its current status. */
export class PayoutAllocation {
  code: string;
  title: string;
  ownerId: string;
  expiresAt: number;
  updatedAt: number;
  retries: number;
  active: boolean;
  sequence: number;
  checksum: string;
  capacity: number;
  status: PayoutAllocationStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    expiresAt: number,
    updatedAt: number,
    retries: number,
    active: boolean,
    sequence: number,
    checksum: string,
    capacity: number,
    status: PayoutAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
    this.retries = retries;
    this.active = active;
    this.sequence = sequence;
    this.checksum = checksum;
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

  canMoveTo(next: PayoutAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.expiresAt + this.updatedAt) * 100) / 100;
  }

  copy(): PayoutAllocation {
    return new PayoutAllocation(
      this.code,
      this.title,
      this.ownerId,
      this.expiresAt,
      this.updatedAt,
      this.retries,
      this.active,
      this.sequence,
      this.checksum,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a payout allocation in status planned. */
export function newPayoutAllocation(code: string, title: string): PayoutAllocation {
  return new PayoutAllocation(code, title, "", 0, 0, 0, false, 0, "", 0, "planned");
}
