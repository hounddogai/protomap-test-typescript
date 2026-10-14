import * as text from "../../../../kit/text.js";

/** Where a credit budget is in its life cycle. */
export type CreditBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A credit budget as the credit team keeps it. */
export class CreditBudget {
  code: string;
  name: string;
  minimum: number;
  floorValue: number;
  frequencyCap: number;
  windowDays: number;
  score: number;
  pinned: boolean;
  updatedAt: number;
  attempts: number;
  status: CreditBudgetStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    floorValue: number,
    frequencyCap: number,
    windowDays: number,
    score: number,
    pinned: boolean,
    updatedAt: number,
    attempts: number,
    status: CreditBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.score = score;
    this.pinned = pinned;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: CreditBudgetStatus): boolean {
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
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CreditBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netLoad(): number {
    return Math.round(this.minimum * this.floorValue * 100) / 100;
  }

  copy(): CreditBudget {
    return new CreditBudget(
      this.code,
      this.name,
      this.minimum,
      this.floorValue,
      this.frequencyCap,
      this.windowDays,
      this.score,
      this.pinned,
      this.updatedAt,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a credit budget in status new. */
export function newCreditBudget(code: string, name: string): CreditBudget {
  return new CreditBudget(code, name, 0, 0, 0, 0, 0, false, 0, 0, "new");
}
