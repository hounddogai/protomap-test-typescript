import * as text from "../../../../kit/text.js";

/** Where a branch batch is in its life cycle. */
export type BranchBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A branch batch as the branch team keeps it. */
export class BranchBatch {
  code: string;
  name: string;
  endsAt: number;
  priority: number;
  region: string;
  startsAt: number;
  attempts: number;
  phone: string;
  currency: string;
  status: BranchBatchStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    priority: number,
    region: string,
    startsAt: number,
    attempts: number,
    phone: string,
    currency: string,
    status: BranchBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.priority = priority;
    this.region = region;
    this.startsAt = startsAt;
    this.attempts = attempts;
    this.phone = phone;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round((this.startsAt + this.endsAt) * 100) / 100;
  }

  copy(): BranchBatch {
    return new BranchBatch(
      this.code,
      this.name,
      this.endsAt,
      this.priority,
      this.region,
      this.startsAt,
      this.attempts,
      this.phone,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a branch batch in status draft. */
export function newBranchBatch(code: string, name: string): BranchBatch {
  return new BranchBatch(code, name, 0, 0, "", 0, 0, "", "", "draft");
}
