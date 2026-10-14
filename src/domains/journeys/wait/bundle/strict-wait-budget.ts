import * as text from "../../../../kit/text.js";

/** Where a strict wait budget is in its life cycle. */
export type StrictWaitBudgetStatus = "created" | "validated" | "published" | "retired";

/** A strict wait budget. Its code is unique within a tenant. */
export class StrictWaitBudget {
  code: string;
  title: string;
  batchSize: number;
  createdAt: number;
  weight: number;
  status: StrictWaitBudgetStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    createdAt: number,
    weight: number,
    status: StrictWaitBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.weight = weight;
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

  canMoveTo(next: StrictWaitBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictWaitBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict wait budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.createdAt - this.weight) * 100) / 100;
  }

  copy(): StrictWaitBudget {
    return new StrictWaitBudget(this.code, this.title, this.batchSize, this.createdAt, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict wait budget in status created. */
export function newStrictWaitBudget(code: string, title: string): StrictWaitBudget {
  return new StrictWaitBudget(code, title, 0, 0, 0, "created");
}
