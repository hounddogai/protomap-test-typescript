/**
 * The double opt in budget records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in budget is in its life cycle. */
export type DoubleOptInBudgetStatus = "created" | "validated" | "published" | "retired";

/** One double opt in budget, with what the planners need to act on it. */
export class DoubleOptInBudget {
  code: string;
  title: string;
  amount: number;
  rate: number;
  active: boolean;
  createdAt: number;
  windowDays: number;
  sequence: number;
  attempts: number;
  status: DoubleOptInBudgetStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    rate: number,
    active: boolean,
    createdAt: number,
    windowDays: number,
    sequence: number,
    attempts: number,
    status: DoubleOptInBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.rate = rate;
    this.active = active;
    this.createdAt = createdAt;
    this.windowDays = windowDays;
    this.sequence = sequence;
    this.attempts = attempts;
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

  canMoveTo(next: DoubleOptInBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DoubleOptInBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.createdAt + this.sequence) * 100) / 100;
  }

  copy(): DoubleOptInBudget {
    return new DoubleOptInBudget(
      this.code,
      this.title,
      this.amount,
      this.rate,
      this.active,
      this.createdAt,
      this.windowDays,
      this.sequence,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a double opt in budget in status created. */
export function newDoubleOptInBudget(code: string, title: string): DoubleOptInBudget {
  return new DoubleOptInBudget(code, title, 0, 0, false, 0, 0, 0, 0, "created");
}
