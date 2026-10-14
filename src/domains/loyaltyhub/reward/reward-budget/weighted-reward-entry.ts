import * as text from "../../../../kit/text.js";

/** Where a weighted reward entry is in its life cycle. */
export type WeightedRewardEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One weighted reward entry, with what the planners need to act on it. */
export class WeightedRewardEntry {
  code: string;
  name: string;
  locale: string;
  cost: number;
  budget: number;
  status: WeightedRewardEntryStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    cost: number,
    budget: number,
    status: WeightedRewardEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.cost = cost;
    this.budget = budget;
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

  canMoveTo(next: WeightedRewardEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRewardEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted reward entry"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.cost - this.budget) * 100) / 100;
  }

  copy(): WeightedRewardEntry {
    return new WeightedRewardEntry(this.code, this.name, this.locale, this.cost, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted reward entry in status open. */
export function newWeightedRewardEntry(code: string, name: string): WeightedRewardEntry {
  return new WeightedRewardEntry(code, name, "", 0, 0, "open");
}
