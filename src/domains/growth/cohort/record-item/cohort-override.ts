import * as text from "../../../../kit/text.js";

/** Where a cohort override is in its life cycle. */
export type CohortOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** One cohort override, with what the planners need to act on it. */
export class CohortOverride {
  code: string;
  name: string;
  clicks: number;
  budget: number;
  version: number;
  category: string;
  status: CohortOverrideStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    budget: number,
    version: number,
    category: string,
    status: CohortOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.budget = budget;
    this.version = version;
    this.category = category;
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

  canMoveTo(next: CohortOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.version * this.budget * 100) / 100;
  }

  copy(): CohortOverride {
    return new CohortOverride(this.code, this.name, this.clicks, this.budget, this.version, this.category, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a cohort override in status requested. */
export function newCohortOverride(code: string, name: string): CohortOverride {
  return new CohortOverride(code, name, 0, 0, 0, "", "requested");
}
