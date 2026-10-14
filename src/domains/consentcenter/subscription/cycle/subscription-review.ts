import * as text from "../../../../kit/text.js";

/** Where a subscription review is in its life cycle. */
export type SubscriptionReviewStatus = "created" | "validated" | "published" | "retired";

/** One subscription review, with what the planners need to act on it. */
export class SubscriptionReview {
  code: string;
  title: string;
  description: string;
  threshold: number;
  createdAt: number;
  limit: number;
  batchSize: number;
  audienceId: string;
  utmSource: string;
  revision: number;
  journeyId: string;
  status: SubscriptionReviewStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    threshold: number,
    createdAt: number,
    limit: number,
    batchSize: number,
    audienceId: string,
    utmSource: string,
    revision: number,
    journeyId: string,
    status: SubscriptionReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.threshold = threshold;
    this.createdAt = createdAt;
    this.limit = limit;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.utmSource = utmSource;
    this.revision = revision;
    this.journeyId = journeyId;
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

  canMoveTo(next: SubscriptionReviewStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"subscription review"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.threshold + this.createdAt) * 100) / 100;
  }

  copy(): SubscriptionReview {
    return new SubscriptionReview(
      this.code,
      this.title,
      this.description,
      this.threshold,
      this.createdAt,
      this.limit,
      this.batchSize,
      this.audienceId,
      this.utmSource,
      this.revision,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a subscription review in status created. */
export function newSubscriptionReview(code: string, title: string): SubscriptionReview {
  return new SubscriptionReview(code, title, "", 0, 0, 0, 0, "", "", 0, "", "created");
}
