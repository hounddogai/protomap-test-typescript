import * as text from "../../../../kit/text.js";

/** Where a reward budget is in its life cycle. */
export type RewardBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A reward budget as the reward team keeps it. */
export class RewardBudget {
  code: string;
  label: string;
  title: string;
  endsAt: number;
  contactEmail: string;
  notes: string;
  cohort: string;
  floorValue: number;
  status: RewardBudgetStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    endsAt: number,
    contactEmail: string,
    notes: string,
    cohort: string,
    floorValue: number,
    status: RewardBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.endsAt = endsAt;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.cohort = cohort;
    this.floorValue = floorValue;
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

  canMoveTo(next: RewardBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.endsAt + this.floorValue) * 100) / 100;
  }

  copy(): RewardBudget {
    return new RewardBudget(
      this.code,
      this.label,
      this.title,
      this.endsAt,
      this.contactEmail,
      this.notes,
      this.cohort,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward budget in status requested. */
export function newRewardBudget(code: string, label: string): RewardBudget {
  return new RewardBudget(code, label, "", 0, "", "", "", 0, "requested");
}
