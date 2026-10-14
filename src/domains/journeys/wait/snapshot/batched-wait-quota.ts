import * as text from "../../../../kit/text.js";

/** Where a batched wait quota is in its life cycle. */
export type BatchedWaitQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched wait quota as the wait team keeps it. */
export class BatchedWaitQuota {
  code: string;
  title: string;
  revision: number;
  reviewer: string;
  cohort: string;
  locale: string;
  amount: number;
  variant: string;
  score: number;
  currency: string;
  status: BatchedWaitQuotaStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    reviewer: string,
    cohort: string,
    locale: string,
    amount: number,
    variant: string,
    score: number,
    currency: string,
    status: BatchedWaitQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.locale = locale;
    this.amount = amount;
    this.variant = variant;
    this.score = score;
    this.currency = currency;
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

  canMoveTo(next: BatchedWaitQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedWaitQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched wait quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.score + this.amount) * 100) / 100;
  }

  copy(): BatchedWaitQuota {
    return new BatchedWaitQuota(
      this.code,
      this.title,
      this.revision,
      this.reviewer,
      this.cohort,
      this.locale,
      this.amount,
      this.variant,
      this.score,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched wait quota in status proposed. */
export function newBatchedWaitQuota(code: string, title: string): BatchedWaitQuota {
  return new BatchedWaitQuota(code, title, 0, "", "", "", 0, "", 0, "", "proposed");
}
