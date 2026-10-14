import * as text from "../../../../kit/text.js";

/** Where a rolling wait budget is in its life cycle. */
export type RollingWaitBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling wait budget as the wait team keeps it. */
export class RollingWaitBudget {
  code: string;
  name: string;
  clicks: number;
  sequence: number;
  title: string;
  status: RollingWaitBudgetStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    sequence: number,
    title: string,
    status: RollingWaitBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.sequence = sequence;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingWaitBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWaitBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling wait budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.sequence - this.clicks) * 100) / 100;
  }

  copy(): RollingWaitBudget {
    return new RollingWaitBudget(this.code, this.name, this.clicks, this.sequence, this.title, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling wait budget in status requested. */
export function newRollingWaitBudget(code: string, name: string): RollingWaitBudget {
  return new RollingWaitBudget(code, name, 0, 0, "", "requested");
}
