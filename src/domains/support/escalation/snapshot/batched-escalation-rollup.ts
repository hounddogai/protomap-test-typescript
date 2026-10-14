import * as text from "../../../../kit/text.js";

/** Where a batched escalation rollup is in its life cycle. */
export type BatchedEscalationRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a batched escalation rollup and its current status. */
export class BatchedEscalationRollup {
  code: string;
  title: string;
  pinned: boolean;
  approved: boolean;
  ownerId: string;
  externalRef: string;
  capacity: number;
  status: BatchedEscalationRollupStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    approved: boolean,
    ownerId: string,
    externalRef: string,
    capacity: number,
    status: BatchedEscalationRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.approved = approved;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
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

  canMoveTo(next: BatchedEscalationRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedEscalationRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched escalation rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched escalation rollup"} ${this.code}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): BatchedEscalationRollup {
    return new BatchedEscalationRollup(
      this.code,
      this.title,
      this.pinned,
      this.approved,
      this.ownerId,
      this.externalRef,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched escalation rollup in status planned. */
export function newBatchedEscalationRollup(code: string, title: string): BatchedEscalationRollup {
  return new BatchedEscalationRollup(code, title, false, false, "", "", 0, "planned");
}
