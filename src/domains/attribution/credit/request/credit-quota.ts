import * as text from "../../../../kit/text.js";

/** Where a credit quota is in its life cycle. */
export type CreditQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One credit quota, with what the planners need to act on it. */
export class CreditQuota {
  code: string;
  label: string;
  updatedAt: number;
  description: string;
  cohort: string;
  amount: number;
  tags: string[];
  status: CreditQuotaStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    description: string,
    cohort: string,
    amount: number,
    tags: string[],
    status: CreditQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.description = description;
    this.cohort = cohort;
    this.amount = amount;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreditQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.updatedAt * this.amount * 100) / 100;
  }

  copy(): CreditQuota {
    return new CreditQuota(
      this.code,
      this.label,
      this.updatedAt,
      this.description,
      this.cohort,
      this.amount,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a credit quota in status planned. */
export function newCreditQuota(code: string, label: string): CreditQuota {
  return new CreditQuota(code, label, 0, "", "", 0, [], "planned");
}
