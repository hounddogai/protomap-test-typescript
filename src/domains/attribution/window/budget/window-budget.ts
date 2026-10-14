/**
 * The window budget records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window budget is in its life cycle. */
export type WindowBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** One window budget, with what the planners need to act on it. */
export class WindowBudget {
  code: string;
  name: string;
  title: string;
  timezone: string;
  revision: number;
  currency: string;
  openRate: number;
  status: WindowBudgetStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    timezone: string,
    revision: number,
    currency: string,
    openRate: number,
    status: WindowBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.timezone = timezone;
    this.revision = revision;
    this.currency = currency;
    this.openRate = openRate;
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

  canMoveTo(next: WindowBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round(this.revision * this.openRate * 100) / 100;
  }

  copy(): WindowBudget {
    return new WindowBudget(
      this.code,
      this.name,
      this.title,
      this.timezone,
      this.revision,
      this.currency,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a window budget in status new. */
export function newWindowBudget(code: string, name: string): WindowBudget {
  return new WindowBudget(code, name, "", "", 0, "", 0, "new");
}
