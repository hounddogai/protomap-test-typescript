import * as text from "../../../../kit/text.js";

/** Where a activation budget is in its life cycle. */
export type ActivationBudgetStatus = "created" | "validated" | "published" | "retired";

/** A activation budget as the activation team keeps it. */
export class ActivationBudget {
  code: string;
  title: string;
  active: boolean;
  threshold: number;
  windowDays: number;
  ceiling: number;
  status: ActivationBudgetStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    threshold: number,
    windowDays: number,
    ceiling: number,
    status: ActivationBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.ceiling = ceiling;
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

  canMoveTo(next: ActivationBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ActivationBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.ceiling - this.threshold) * 100) / 100;
  }

  copy(): ActivationBudget {
    return new ActivationBudget(
      this.code,
      this.title,
      this.active,
      this.threshold,
      this.windowDays,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a activation budget in status created. */
export function newActivationBudget(code: string, title: string): ActivationBudget {
  return new ActivationBudget(code, title, false, 0, 0, 0, "created");
}
