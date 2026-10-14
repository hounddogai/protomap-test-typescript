import * as text from "../../../../kit/text.js";

/** Where a fallback reply budget is in its life cycle. */
export type FallbackReplyBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback reply budget. Its code is unique within a tenant. */
export class FallbackReplyBudget {
  code: string;
  name: string;
  ceiling: number;
  ratio: number;
  locale: string;
  priority: number;
  startsAt: number;
  pinned: boolean;
  discount: number;
  status: FallbackReplyBudgetStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    ratio: number,
    locale: string,
    priority: number,
    startsAt: number,
    pinned: boolean,
    discount: number,
    status: FallbackReplyBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.ratio = ratio;
    this.locale = locale;
    this.priority = priority;
    this.startsAt = startsAt;
    this.pinned = pinned;
    this.discount = discount;
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

  canMoveTo(next: FallbackReplyBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackReplyBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reply budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedValue(): number {
    return Math.round((this.ceiling + this.startsAt) * 100) / 100;
  }

  copy(): FallbackReplyBudget {
    return new FallbackReplyBudget(
      this.code,
      this.name,
      this.ceiling,
      this.ratio,
      this.locale,
      this.priority,
      this.startsAt,
      this.pinned,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback reply budget in status open. */
export function newFallbackReplyBudget(code: string, name: string): FallbackReplyBudget {
  return new FallbackReplyBudget(code, name, 0, 0, "", 0, 0, false, 0, "open");
}
