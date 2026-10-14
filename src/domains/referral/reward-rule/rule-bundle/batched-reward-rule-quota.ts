import * as text from "../../../../kit/text.js";

/** Where a batched reward rule quota is in its life cycle. */
export type BatchedRewardRuleQuotaStatus = "created" | "validated" | "published" | "retired";

/** A batched reward rule quota. Its code is unique within a tenant. */
export class BatchedRewardRuleQuota {
  code: string;
  title: string;
  utmSource: string;
  margin: number;
  country: string;
  campaignRef: string;
  currency: string;
  pinned: boolean;
  limit: number;
  attempts: number;
  status: BatchedRewardRuleQuotaStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    margin: number,
    country: string,
    campaignRef: string,
    currency: string,
    pinned: boolean,
    limit: number,
    attempts: number,
    status: BatchedRewardRuleQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.margin = margin;
    this.country = country;
    this.campaignRef = campaignRef;
    this.currency = currency;
    this.pinned = pinned;
    this.limit = limit;
    this.attempts = attempts;
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

  canMoveTo(next: BatchedRewardRuleQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedRewardRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reward rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round((this.attempts - this.limit) * 100) / 100;
  }

  copy(): BatchedRewardRuleQuota {
    return new BatchedRewardRuleQuota(
      this.code,
      this.title,
      this.utmSource,
      this.margin,
      this.country,
      this.campaignRef,
      this.currency,
      this.pinned,
      this.limit,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched reward rule quota in status created. */
export function newBatchedRewardRuleQuota(code: string, title: string): BatchedRewardRuleQuota {
  return new BatchedRewardRuleQuota(code, title, "", 0, "", "", "", false, 0, 0, "created");
}
