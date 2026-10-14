import * as text from "../../../../kit/text.js";

/** Where a regional preference variance is in its life cycle. */
export type RegionalPreferenceVarianceStatus = "created" | "validated" | "published" | "retired";

/** A regional preference variance as the preference team keeps it. */
export class RegionalPreferenceVariance {
  code: string;
  label: string;
  visible: boolean;
  approved: boolean;
  ownerId: string;
  country: string;
  source: string;
  amount: number;
  retries: number;
  priority: number;
  reviewer: string;
  status: RegionalPreferenceVarianceStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    approved: boolean,
    ownerId: string,
    country: string,
    source: string,
    amount: number,
    retries: number,
    priority: number,
    reviewer: string,
    status: RegionalPreferenceVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.approved = approved;
    this.ownerId = ownerId;
    this.country = country;
    this.source = source;
    this.amount = amount;
    this.retries = retries;
    this.priority = priority;
    this.reviewer = reviewer;
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

  canMoveTo(next: RegionalPreferenceVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalPreferenceVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional preference variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional preference variance"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.retries * this.priority * 100) / 100;
  }

  copy(): RegionalPreferenceVariance {
    return new RegionalPreferenceVariance(
      this.code,
      this.label,
      this.visible,
      this.approved,
      this.ownerId,
      this.country,
      this.source,
      this.amount,
      this.retries,
      this.priority,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional preference variance in status created. */
export function newRegionalPreferenceVariance(code: string, label: string): RegionalPreferenceVariance {
  return new RegionalPreferenceVariance(code, label, false, false, "", "", "", 0, 0, 0, "", "created");
}
