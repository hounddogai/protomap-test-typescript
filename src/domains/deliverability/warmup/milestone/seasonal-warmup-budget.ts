import * as text from "../../../../kit/text.js";

/** Where a seasonal warmup budget is in its life cycle. */
export type SeasonalWarmupBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal warmup budget as the warmup team keeps it. */
export class SeasonalWarmupBudget {
  code: string;
  name: string;
  frequencyCap: number;
  notes: string;
  margin: number;
  status: SeasonalWarmupBudgetStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    notes: string,
    margin: number,
    status: SeasonalWarmupBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.margin = margin;
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

  canMoveTo(next: SeasonalWarmupBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
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

  moveTo(next: SeasonalWarmupBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal warmup budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round(this.frequencyCap * this.margin * 100) / 100;
  }

  copy(): SeasonalWarmupBudget {
    return new SeasonalWarmupBudget(this.code, this.name, this.frequencyCap, this.notes, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal warmup budget in status draft. */
export function newSeasonalWarmupBudget(code: string, name: string): SeasonalWarmupBudget {
  return new SeasonalWarmupBudget(code, name, 0, "", 0, "draft");
}
