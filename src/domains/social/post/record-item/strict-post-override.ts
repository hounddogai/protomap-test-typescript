import * as text from "../../../../kit/text.js";

/** Where a strict post override is in its life cycle. */
export type StrictPostOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict post override, with what the planners need to act on it. */
export class StrictPostOverride {
  code: string;
  name: string;
  bid: number;
  weight: number;
  capacity: number;
  budget: number;
  cohort: string;
  status: StrictPostOverrideStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    weight: number,
    capacity: number,
    budget: number,
    cohort: string,
    status: StrictPostOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.weight = weight;
    this.capacity = capacity;
    this.budget = budget;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPostOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictPostOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict post override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.capacity * this.bid * 100) / 100;
  }

  copy(): StrictPostOverride {
    return new StrictPostOverride(
      this.code,
      this.name,
      this.bid,
      this.weight,
      this.capacity,
      this.budget,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict post override in status new. */
export function newStrictPostOverride(code: string, name: string): StrictPostOverride {
  return new StrictPostOverride(code, name, 0, 0, 0, 0, "", "new");
}
