import * as text from "../../../../kit/text.js";

/** Where a weighted badge budget is in its life cycle. */
export type WeightedBadgeBudgetStatus = "created" | "validated" | "published" | "retired";

/** A weighted badge budget. Its code is unique within a tenant. */
export class WeightedBadgeBudget {
  code: string;
  title: string;
  limit: number;
  utmSource: string;
  notes: string;
  status: WeightedBadgeBudgetStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    utmSource: string,
    notes: string,
    status: WeightedBadgeBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.utmSource = utmSource;
    this.notes = notes;
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

  canMoveTo(next: WeightedBadgeBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
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

  moveTo(next: WeightedBadgeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted badge budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): WeightedBadgeBudget {
    return new WeightedBadgeBudget(this.code, this.title, this.limit, this.utmSource, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a weighted badge budget in status created. */
export function newWeightedBadgeBudget(code: string, title: string): WeightedBadgeBudget {
  return new WeightedBadgeBudget(code, title, 0, "", "", "created");
}
