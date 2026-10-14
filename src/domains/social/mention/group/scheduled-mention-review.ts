import * as text from "../../../../kit/text.js";

/** Where a scheduled mention review is in its life cycle. */
export type ScheduledMentionReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a scheduled mention review and its current status. */
export class ScheduledMentionReview {
  code: string;
  title: string;
  currency: string;
  revision: number;
  timezone: string;
  reviewer: string;
  status: ScheduledMentionReviewStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    revision: number,
    timezone: string,
    reviewer: string,
    status: ScheduledMentionReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.revision = revision;
    this.timezone = timezone;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledMentionReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledMentionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled mention review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"scheduled mention review"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): ScheduledMentionReview {
    return new ScheduledMentionReview(
      this.code,
      this.title,
      this.currency,
      this.revision,
      this.timezone,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled mention review in status draft. */
export function newScheduledMentionReview(code: string, title: string): ScheduledMentionReview {
  return new ScheduledMentionReview(code, title, "", 0, "", "", "draft");
}
