import * as text from "../../../../kit/text.js";

/** Where a global bounce preference is in its life cycle. */
export type GlobalBouncePreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global bounce preference as the bounce team keeps it. */
export class GlobalBouncePreference {
  code: string;
  label: string;
  amount: number;
  campaignRef: string;
  quantity: number;
  journeyId: string;
  minimum: number;
  cohort: string;
  weight: number;
  budget: number;
  currency: string;
  status: GlobalBouncePreferenceStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    campaignRef: string,
    quantity: number,
    journeyId: string,
    minimum: number,
    cohort: string,
    weight: number,
    budget: number,
    currency: string,
    status: GlobalBouncePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.journeyId = journeyId;
    this.minimum = minimum;
    this.cohort = cohort;
    this.weight = weight;
    this.budget = budget;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalBouncePreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalBouncePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global bounce preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.minimum - this.weight) * 100) / 100;
  }

  copy(): GlobalBouncePreference {
    return new GlobalBouncePreference(
      this.code,
      this.label,
      this.amount,
      this.campaignRef,
      this.quantity,
      this.journeyId,
      this.minimum,
      this.cohort,
      this.weight,
      this.budget,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global bounce preference in status new. */
export function newGlobalBouncePreference(code: string, label: string): GlobalBouncePreference {
  return new GlobalBouncePreference(code, label, 0, "", 0, "", 0, "", 0, 0, "", "new");
}
