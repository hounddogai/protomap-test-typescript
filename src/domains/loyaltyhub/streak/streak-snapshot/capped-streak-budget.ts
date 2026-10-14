import * as text from "../../../../kit/text.js";

/** Where a capped streak budget is in its life cycle. */
export type CappedStreakBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped streak budget. Its code is unique within a tenant. */
export class CappedStreakBudget {
  code: string;
  title: string;
  updatedAt: number;
  summary: string;
  variant: string;
  locale: string;
  country: string;
  status: CappedStreakBudgetStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    summary: string,
    variant: string,
    locale: string,
    country: string,
    status: CappedStreakBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.summary = summary;
    this.variant = variant;
    this.locale = locale;
    this.country = country;
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

  canMoveTo(next: CappedStreakBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedStreakBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped streak budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): CappedStreakBudget {
    return new CappedStreakBudget(
      this.code,
      this.title,
      this.updatedAt,
      this.summary,
      this.variant,
      this.locale,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped streak budget in status idle. */
export function newCappedStreakBudget(code: string, title: string): CappedStreakBudget {
  return new CappedStreakBudget(code, title, 0, "", "", "", "", "idle");
}
