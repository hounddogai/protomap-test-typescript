import * as text from "../../../../kit/text.js";

/** Where a pending cohort budget is in its life cycle. */
export type PendingCohortBudgetStatus = "created" | "validated" | "published" | "retired";

/** A pending cohort budget as the cohort team keeps it. */
export class PendingCohortBudget {
  code: string;
  name: string;
  unit: string;
  region: string;
  locale: string;
  approved: boolean;
  quantity: number;
  sendAt: number;
  status: PendingCohortBudgetStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    region: string,
    locale: string,
    approved: boolean,
    quantity: number,
    sendAt: number,
    status: PendingCohortBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.region = region;
    this.locale = locale;
    this.approved = approved;
    this.quantity = quantity;
    this.sendAt = sendAt;
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

  canMoveTo(next: PendingCohortBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCohortBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending cohort budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending cohort budget"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.sendAt * this.quantity * 100) / 100;
  }

  copy(): PendingCohortBudget {
    return new PendingCohortBudget(
      this.code,
      this.name,
      this.unit,
      this.region,
      this.locale,
      this.approved,
      this.quantity,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending cohort budget in status created. */
export function newPendingCohortBudget(code: string, name: string): PendingCohortBudget {
  return new PendingCohortBudget(code, name, "", "", "", false, 0, 0, "created");
}
