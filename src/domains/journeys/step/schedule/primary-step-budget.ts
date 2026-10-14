import * as text from "../../../../kit/text.js";

/** Where a primary step budget is in its life cycle. */
export type PrimaryStepBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary step budget as the step team keeps it. */
export class PrimaryStepBudget {
  code: string;
  label: string;
  region: string;
  sendAt: number;
  budget: number;
  approved: boolean;
  weight: number;
  category: string;
  windowDays: number;
  description: string;
  status: PrimaryStepBudgetStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    sendAt: number,
    budget: number,
    approved: boolean,
    weight: number,
    category: string,
    windowDays: number,
    description: string,
    status: PrimaryStepBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.sendAt = sendAt;
    this.budget = budget;
    this.approved = approved;
    this.weight = weight;
    this.category = category;
    this.windowDays = windowDays;
    this.description = description;
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

  canMoveTo(next: PrimaryStepBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryStepBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary step budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round((this.windowDays - this.budget) * 100) / 100;
  }

  copy(): PrimaryStepBudget {
    return new PrimaryStepBudget(
      this.code,
      this.label,
      this.region,
      this.sendAt,
      this.budget,
      this.approved,
      this.weight,
      this.category,
      this.windowDays,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a primary step budget in status requested. */
export function newPrimaryStepBudget(code: string, label: string): PrimaryStepBudget {
  return new PrimaryStepBudget(code, label, "", 0, 0, false, 0, "", 0, "", "requested");
}
