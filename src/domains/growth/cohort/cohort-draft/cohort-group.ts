import * as text from "../../../../kit/text.js";

/** Where a cohort group is in its life cycle. */
export type CohortGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a cohort group and its current status. */
export class CohortGroup {
  code: string;
  label: string;
  phone: string;
  title: string;
  currency: string;
  amount: number;
  status: CohortGroupStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    title: string,
    currency: string,
    amount: number,
    status: CohortGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.title = title;
    this.currency = currency;
    this.amount = amount;
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

  canMoveTo(next: CohortGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
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

  moveTo(next: CohortGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"cohort group"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): CohortGroup {
    return new CohortGroup(this.code, this.label, this.phone, this.title, this.currency, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a cohort group in status draft. */
export function newCohortGroup(code: string, label: string): CohortGroup {
  return new CohortGroup(code, label, "", "", "", 0, "draft");
}
