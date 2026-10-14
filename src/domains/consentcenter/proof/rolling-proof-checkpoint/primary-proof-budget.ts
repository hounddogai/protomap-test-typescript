import * as text from "../../../../kit/text.js";

/** Where a primary proof budget is in its life cycle. */
export type PrimaryProofBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One primary proof budget, with what the planners need to act on it. */
export class PrimaryProofBudget {
  code: string;
  name: string;
  budget: number;
  campaignRef: string;
  label: string;
  timezone: string;
  limit: number;
  openRate: number;
  archived: boolean;
  utmSource: string;
  threshold: number;
  status: PrimaryProofBudgetStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    campaignRef: string,
    label: string,
    timezone: string,
    limit: number,
    openRate: number,
    archived: boolean,
    utmSource: string,
    threshold: number,
    status: PrimaryProofBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.campaignRef = campaignRef;
    this.label = label;
    this.timezone = timezone;
    this.limit = limit;
    this.openRate = openRate;
    this.archived = archived;
    this.utmSource = utmSource;
    this.threshold = threshold;
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

  canMoveTo(next: PrimaryProofBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryProofBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary proof budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round(this.limit * this.threshold * 100) / 100;
  }

  copy(): PrimaryProofBudget {
    return new PrimaryProofBudget(
      this.code,
      this.name,
      this.budget,
      this.campaignRef,
      this.label,
      this.timezone,
      this.limit,
      this.openRate,
      this.archived,
      this.utmSource,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary proof budget in status proposed. */
export function newPrimaryProofBudget(code: string, name: string): PrimaryProofBudget {
  return new PrimaryProofBudget(code, name, 0, "", "", "", 0, 0, false, "", 0, "proposed");
}
