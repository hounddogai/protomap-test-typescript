import * as text from "../../../../kit/text.js";

/** Where a strict nudge budget is in its life cycle. */
export type StrictNudgeBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict nudge budget. Its code is unique within a tenant. */
export class StrictNudgeBudget {
  code: string;
  title: string;
  retries: number;
  impressions: number;
  score: number;
  quantity: number;
  status: StrictNudgeBudgetStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    impressions: number,
    score: number,
    quantity: number,
    status: StrictNudgeBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.impressions = impressions;
    this.score = score;
    this.quantity = quantity;
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

  canMoveTo(next: StrictNudgeBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: StrictNudgeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict nudge budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round(this.quantity * this.score * 100) / 100;
  }

  copy(): StrictNudgeBudget {
    return new StrictNudgeBudget(
      this.code,
      this.title,
      this.retries,
      this.impressions,
      this.score,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict nudge budget in status open. */
export function newStrictNudgeBudget(code: string, title: string): StrictNudgeBudget {
  return new StrictNudgeBudget(code, title, 0, 0, 0, 0, "open");
}
