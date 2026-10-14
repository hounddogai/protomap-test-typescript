import * as text from "../../../../kit/text.js";

/** Where a batched reward review is in its life cycle. */
export type BatchedRewardReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched reward review as the reward team keeps it. */
export class BatchedRewardReview {
  code: string;
  label: string;
  externalRef: string;
  journeyId: string;
  reviewer: string;
  retries: number;
  tags: string[];
  locale: string;
  maximum: number;
  country: string;
  status: BatchedRewardReviewStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    journeyId: string,
    reviewer: string,
    retries: number,
    tags: string[],
    locale: string,
    maximum: number,
    country: string,
    status: BatchedRewardReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
    this.retries = retries;
    this.tags = tags;
    this.locale = locale;
    this.maximum = maximum;
    this.country = country;
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

  canMoveTo(next: BatchedRewardReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedRewardReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reward review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round(this.retries * this.maximum * 100) / 100;
  }

  copy(): BatchedRewardReview {
    return new BatchedRewardReview(
      this.code,
      this.label,
      this.externalRef,
      this.journeyId,
      this.reviewer,
      this.retries,
      this.tags,
      this.locale,
      this.maximum,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched reward review in status new. */
export function newBatchedRewardReview(code: string, label: string): BatchedRewardReview {
  return new BatchedRewardReview(code, label, "", "", "", 0, [], "", 0, "", "new");
}
