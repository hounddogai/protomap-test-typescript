import * as text from "../../../../kit/text.js";

/** Where a pacing budget is in its life cycle. */
export type PacingBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pacing budget and its current status. */
export class PacingBudget {
  code: string;
  name: string;
  endsAt: number;
  cost: number;
  expiresAt: number;
  currency: string;
  externalRef: string;
  priority: number;
  status: PacingBudgetStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    cost: number,
    expiresAt: number,
    currency: string,
    externalRef: string,
    priority: number,
    status: PacingBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.externalRef = externalRef;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PacingBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.priority + this.expiresAt) * 100) / 100;
  }

  copy(): PacingBudget {
    return new PacingBudget(
      this.code,
      this.name,
      this.endsAt,
      this.cost,
      this.expiresAt,
      this.currency,
      this.externalRef,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pacing budget in status draft. */
export function newPacingBudget(code: string, name: string): PacingBudget {
  return new PacingBudget(code, name, 0, 0, 0, "", "", 0, "draft");
}
