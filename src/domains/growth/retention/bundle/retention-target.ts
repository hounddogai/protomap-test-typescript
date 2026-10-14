import * as text from "../../../../kit/text.js";

/** Where a retention target is in its life cycle. */
export type RetentionTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A retention target as the retention team keeps it. */
export class RetentionTarget {
  code: string;
  name: string;
  approved: boolean;
  amount: number;
  attempts: number;
  status: RetentionTargetStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    amount: number,
    attempts: number,
    status: RetentionTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.amount = amount;
    this.attempts = attempts;
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

  canMoveTo(next: RetentionTargetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RetentionTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netTotal(): number {
    return Math.round(this.attempts * this.amount * 100) / 100;
  }

  copy(): RetentionTarget {
    return new RetentionTarget(this.code, this.name, this.approved, this.amount, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention target in status new. */
export function newRetentionTarget(code: string, name: string): RetentionTarget {
  return new RetentionTarget(code, name, false, 0, 0, "new");
}
