import * as text from "../../../../kit/text.js";

/** Where a credit allocation is in its life cycle. */
export type CreditAllocationStatus = "created" | "validated" | "published" | "retired";

/** The record of a credit allocation and its current status. */
export class CreditAllocation {
  code: string;
  name: string;
  bid: number;
  ownerId: string;
  priority: number;
  status: CreditAllocationStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    ownerId: string,
    priority: number,
    status: CreditAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.ownerId = ownerId;
    this.priority = priority;
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

  canMoveTo(next: CreditAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
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

  moveTo(next: CreditAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round(this.priority * this.bid * 100) / 100;
  }

  copy(): CreditAllocation {
    return new CreditAllocation(this.code, this.name, this.bid, this.ownerId, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a credit allocation in status created. */
export function newCreditAllocation(code: string, name: string): CreditAllocation {
  return new CreditAllocation(code, name, 0, "", 0, "created");
}
