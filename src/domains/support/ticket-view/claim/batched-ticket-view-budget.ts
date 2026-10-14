import * as text from "../../../../kit/text.js";

/** Where a batched ticket view budget is in its life cycle. */
export type BatchedTicketViewBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched ticket view budget. Its code is unique within a tenant. */
export class BatchedTicketViewBudget {
  code: string;
  label: string;
  version: number;
  ratio: number;
  discount: number;
  quantity: number;
  status: BatchedTicketViewBudgetStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    ratio: number,
    discount: number,
    quantity: number,
    status: BatchedTicketViewBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.ratio = ratio;
    this.discount = discount;
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

  canMoveTo(next: BatchedTicketViewBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
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

  moveTo(next: BatchedTicketViewBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched ticket view budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.quantity - this.version) * 100) / 100;
  }

  copy(): BatchedTicketViewBudget {
    return new BatchedTicketViewBudget(
      this.code,
      this.label,
      this.version,
      this.ratio,
      this.discount,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched ticket view budget in status new. */
export function newBatchedTicketViewBudget(code: string, label: string): BatchedTicketViewBudget {
  return new BatchedTicketViewBudget(code, label, 0, 0, 0, 0, "new");
}
