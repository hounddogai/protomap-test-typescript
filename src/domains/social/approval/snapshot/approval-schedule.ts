import * as text from "../../../../kit/text.js";

/** Where a approval schedule is in its life cycle. */
export type ApprovalScheduleStatus = "created" | "validated" | "published" | "retired";

/** A approval schedule as the approval team keeps it. */
export class ApprovalSchedule {
  code: string;
  name: string;
  description: string;
  score: number;
  discount: number;
  batchSize: number;
  status: ApprovalScheduleStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    score: number,
    discount: number,
    batchSize: number,
    status: ApprovalScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.score = score;
    this.discount = discount;
    this.batchSize = batchSize;
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

  canMoveTo(next: ApprovalScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ApprovalScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.score + this.batchSize) * 100) / 100;
  }

  copy(): ApprovalSchedule {
    return new ApprovalSchedule(
      this.code,
      this.name,
      this.description,
      this.score,
      this.discount,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval schedule in status created. */
export function newApprovalSchedule(code: string, name: string): ApprovalSchedule {
  return new ApprovalSchedule(code, name, "", 0, 0, 0, "created");
}
