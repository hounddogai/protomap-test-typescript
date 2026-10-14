import * as text from "../../../../kit/text.js";

/** Where a batched mention review is in its life cycle. */
export type BatchedMentionReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched mention review as the mention team keeps it. */
export class BatchedMentionReview {
  code: string;
  title: string;
  phone: string;
  source: string;
  locale: string;
  frequencyCap: number;
  status: BatchedMentionReviewStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    source: string,
    locale: string,
    frequencyCap: number,
    status: BatchedMentionReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.source = source;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedMentionReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedMentionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched mention review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched mention review"} ${this.code}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): BatchedMentionReview {
    return new BatchedMentionReview(
      this.code,
      this.title,
      this.phone,
      this.source,
      this.locale,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched mention review in status idle. */
export function newBatchedMentionReview(code: string, title: string): BatchedMentionReview {
  return new BatchedMentionReview(code, title, "", "", "", 0, "idle");
}
