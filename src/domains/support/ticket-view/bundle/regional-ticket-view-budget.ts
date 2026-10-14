import * as text from "../../../../kit/text.js";

/** Where a regional ticket view budget is in its life cycle. */
export type RegionalTicketViewBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional ticket view budget. Its code is unique within a tenant. */
export class RegionalTicketViewBudget {
  code: string;
  name: string;
  openRate: number;
  audienceId: string;
  graceDays: number;
  minimum: number;
  locale: string;
  maximum: number;
  status: RegionalTicketViewBudgetStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    audienceId: string,
    graceDays: number,
    minimum: number,
    locale: string,
    maximum: number,
    status: RegionalTicketViewBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.audienceId = audienceId;
    this.graceDays = graceDays;
    this.minimum = minimum;
    this.locale = locale;
    this.maximum = maximum;
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

  canMoveTo(next: RegionalTicketViewBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
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

  moveTo(next: RegionalTicketViewBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional ticket view budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional ticket view budget"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.minimum - this.openRate) * 100) / 100;
  }

  copy(): RegionalTicketViewBudget {
    return new RegionalTicketViewBudget(
      this.code,
      this.name,
      this.openRate,
      this.audienceId,
      this.graceDays,
      this.minimum,
      this.locale,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional ticket view budget in status requested. */
export function newRegionalTicketViewBudget(code: string, name: string): RegionalTicketViewBudget {
  return new RegionalTicketViewBudget(code, name, 0, "", 0, 0, "", 0, "requested");
}
