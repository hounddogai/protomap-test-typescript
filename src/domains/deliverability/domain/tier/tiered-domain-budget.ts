import * as text from "../../../../kit/text.js";

/** Where a tiered domain budget is in its life cycle. */
export type TieredDomainBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered domain budget as the domain team keeps it. */
export class TieredDomainBudget {
  code: string;
  name: string;
  locale: string;
  cohort: string;
  openRate: number;
  contactEmail: string;
  status: TieredDomainBudgetStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    cohort: string,
    openRate: number,
    contactEmail: string,
    status: TieredDomainBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.cohort = cohort;
    this.openRate = openRate;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: TieredDomainBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredDomainBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered domain budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): TieredDomainBudget {
    return new TieredDomainBudget(
      this.code,
      this.name,
      this.locale,
      this.cohort,
      this.openRate,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered domain budget in status draft. */
export function newTieredDomainBudget(code: string, name: string): TieredDomainBudget {
  return new TieredDomainBudget(code, name, "", "", 0, "", "draft");
}
