import * as text from "../../../../kit/text.js";

/** Where a batched placement budget is in its life cycle. */
export type BatchedPlacementBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a batched placement budget and its current status. */
export class BatchedPlacementBudget {
  code: string;
  name: string;
  description: string;
  journeyId: string;
  sequence: number;
  status: BatchedPlacementBudgetStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    journeyId: string,
    sequence: number,
    status: BatchedPlacementBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.journeyId = journeyId;
    this.sequence = sequence;
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

  canMoveTo(next: BatchedPlacementBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedPlacementBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched placement budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched placement budget"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): BatchedPlacementBudget {
    return new BatchedPlacementBudget(
      this.code,
      this.name,
      this.description,
      this.journeyId,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched placement budget in status new. */
export function newBatchedPlacementBudget(code: string, name: string): BatchedPlacementBudget {
  return new BatchedPlacementBudget(code, name, "", "", 0, "new");
}
