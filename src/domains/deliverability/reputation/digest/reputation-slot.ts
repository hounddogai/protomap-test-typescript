import * as text from "../../../../kit/text.js";

/** Where a reputation slot is in its life cycle. */
export type ReputationSlotStatus = "created" | "validated" | "published" | "retired";

/** The record of a reputation slot and its current status. */
export class ReputationSlot {
  code: string;
  title: string;
  version: number;
  reviewer: string;
  budget: number;
  status: ReputationSlotStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    reviewer: string,
    budget: number,
    status: ReputationSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.reviewer = reviewer;
    this.budget = budget;
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

  canMoveTo(next: ReputationSlotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ReputationSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"reputation slot"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.version + this.budget) * 100) / 100;
  }

  copy(): ReputationSlot {
    return new ReputationSlot(this.code, this.title, this.version, this.reviewer, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reputation slot in status created. */
export function newReputationSlot(code: string, title: string): ReputationSlot {
  return new ReputationSlot(code, title, 0, "", 0, "created");
}
