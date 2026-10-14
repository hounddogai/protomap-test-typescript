import * as text from "../../../../kit/text.js";

/** Where a redemption budget is in its life cycle. */
export type RedemptionBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A redemption budget as the redemption team keeps it. */
export class RedemptionBudget {
  code: string;
  title: string;
  locale: string;
  contactEmail: string;
  durationMinutes: number;
  status: RedemptionBudgetStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    contactEmail: string,
    durationMinutes: number,
    status: RedemptionBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): RedemptionBudget {
    return new RedemptionBudget(
      this.code,
      this.title,
      this.locale,
      this.contactEmail,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a redemption budget in status proposed. */
export function newRedemptionBudget(code: string, title: string): RedemptionBudget {
  return new RedemptionBudget(code, title, "", "", 0, "proposed");
}
