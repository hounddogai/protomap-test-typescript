import * as text from "../../../../kit/text.js";

/** Where a strict level budget is in its life cycle. */
export type StrictLevelBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a strict level budget and its current status. */
export class StrictLevelBudget {
  code: string;
  label: string;
  updatedAt: number;
  pinned: boolean;
  ratio: number;
  cohort: string;
  status: StrictLevelBudgetStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    pinned: boolean,
    ratio: number,
    cohort: string,
    status: StrictLevelBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.pinned = pinned;
    this.ratio = ratio;
    this.cohort = cohort;
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

  canMoveTo(next: StrictLevelBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictLevelBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict level budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round((this.ratio + this.updatedAt) * 100) / 100;
  }

  copy(): StrictLevelBudget {
    return new StrictLevelBudget(
      this.code,
      this.label,
      this.updatedAt,
      this.pinned,
      this.ratio,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict level budget in status requested. */
export function newStrictLevelBudget(code: string, label: string): StrictLevelBudget {
  return new StrictLevelBudget(code, label, 0, false, 0, "", "requested");
}
