/**
 * The exit rule budget records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule budget is in its life cycle. */
export type ExitRuleBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One exit rule budget, with what the planners need to act on it. */
export class ExitRuleBudget {
  code: string;
  title: string;
  cohort: string;
  sendAt: number;
  category: string;
  quantity: number;
  phone: string;
  status: ExitRuleBudgetStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    sendAt: number,
    category: string,
    quantity: number,
    phone: string,
    status: ExitRuleBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.category = category;
    this.quantity = quantity;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.sendAt * this.quantity * 100) / 100;
  }

  copy(): ExitRuleBudget {
    return new ExitRuleBudget(
      this.code,
      this.title,
      this.cohort,
      this.sendAt,
      this.category,
      this.quantity,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a exit rule budget in status open. */
export function newExitRuleBudget(code: string, title: string): ExitRuleBudget {
  return new ExitRuleBudget(code, title, "", 0, "", 0, "", "open");
}
