import * as text from "../../../../kit/text.js";

/** Where a capped creative budget is in its life cycle. */
export type CappedCreativeBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One capped creative budget, with what the planners need to act on it. */
export class CappedCreativeBudget {
  code: string;
  title: string;
  sequence: number;
  country: string;
  rate: number;
  cost: number;
  status: CappedCreativeBudgetStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    country: string,
    rate: number,
    cost: number,
    status: CappedCreativeBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.country = country;
    this.rate = rate;
    this.cost = cost;
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

  canMoveTo(next: CappedCreativeBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedCreativeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped creative budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped creative budget"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.rate + this.sequence) * 100) / 100;
  }

  copy(): CappedCreativeBudget {
    return new CappedCreativeBudget(
      this.code,
      this.title,
      this.sequence,
      this.country,
      this.rate,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a capped creative budget in status idle. */
export function newCappedCreativeBudget(code: string, title: string): CappedCreativeBudget {
  return new CappedCreativeBudget(code, title, 0, "", 0, 0, "idle");
}
