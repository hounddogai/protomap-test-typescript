/**
 * The global wait budget records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global wait budget is in its life cycle. */
export type GlobalWaitBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global wait budget as the wait team keeps it. */
export class GlobalWaitBudget {
  code: string;
  label: string;
  visible: boolean;
  clicks: number;
  externalRef: string;
  windowDays: number;
  status: GlobalWaitBudgetStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    clicks: number,
    externalRef: string,
    windowDays: number,
    status: GlobalWaitBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.clicks = clicks;
    this.externalRef = externalRef;
    this.windowDays = windowDays;
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

  canMoveTo(next: GlobalWaitBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
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

  moveTo(next: GlobalWaitBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global wait budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round((this.windowDays - this.clicks) * 100) / 100;
  }

  copy(): GlobalWaitBudget {
    return new GlobalWaitBudget(
      this.code,
      this.label,
      this.visible,
      this.clicks,
      this.externalRef,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global wait budget in status new. */
export function newGlobalWaitBudget(code: string, label: string): GlobalWaitBudget {
  return new GlobalWaitBudget(code, label, false, 0, "", 0, "new");
}
