import * as text from "../../../../kit/text.js";

/** Where a approval checkpoint is in its life cycle. */
export type ApprovalCheckpointStatus = "created" | "validated" | "published" | "retired";

/** The record of a approval checkpoint and its current status. */
export class ApprovalCheckpoint {
  code: string;
  name: string;
  currency: string;
  sequence: number;
  graceDays: number;
  priority: number;
  status: ApprovalCheckpointStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    sequence: number,
    graceDays: number,
    priority: number,
    status: ApprovalCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.sequence = sequence;
    this.graceDays = graceDays;
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

  canMoveTo(next: ApprovalCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ApprovalCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays + this.priority) * 100) / 100;
  }

  copy(): ApprovalCheckpoint {
    return new ApprovalCheckpoint(
      this.code,
      this.name,
      this.currency,
      this.sequence,
      this.graceDays,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval checkpoint in status created. */
export function newApprovalCheckpoint(code: string, name: string): ApprovalCheckpoint {
  return new ApprovalCheckpoint(code, name, "", 0, 0, 0, "created");
}
