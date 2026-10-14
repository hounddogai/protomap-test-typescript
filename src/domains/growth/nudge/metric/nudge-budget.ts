import * as text from "../../../../kit/text.js";

/** Where a nudge budget is in its life cycle. */
export type NudgeBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A nudge budget as the nudge team keeps it. */
export class NudgeBudget {
  code: string;
  label: string;
  locale: string;
  reviewer: string;
  quantity: number;
  status: NudgeBudgetStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    reviewer: string,
    quantity: number,
    status: NudgeBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: NudgeBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: NudgeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): NudgeBudget {
    return new NudgeBudget(this.code, this.label, this.locale, this.reviewer, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a nudge budget in status idle. */
export function newNudgeBudget(code: string, label: string): NudgeBudget {
  return new NudgeBudget(code, label, "", "", 0, "idle");
}
