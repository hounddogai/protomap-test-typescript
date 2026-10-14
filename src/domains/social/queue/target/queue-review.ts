import * as text from "../../../../kit/text.js";

/** Where a queue review is in its life cycle. */
export type QueueReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One queue review, with what the planners need to act on it. */
export class QueueReview {
  code: string;
  title: string;
  quantity: number;
  retries: number;
  endsAt: number;
  amount: number;
  limit: number;
  notes: string;
  updatedAt: number;
  durationMinutes: number;
  campaignRef: string;
  status: QueueReviewStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    retries: number,
    endsAt: number,
    amount: number,
    limit: number,
    notes: string,
    updatedAt: number,
    durationMinutes: number,
    campaignRef: string,
    status: QueueReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.retries = retries;
    this.endsAt = endsAt;
    this.amount = amount;
    this.limit = limit;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueReviewStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: QueueReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"queue review"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.limit + this.quantity) * 100) / 100;
  }

  copy(): QueueReview {
    return new QueueReview(
      this.code,
      this.title,
      this.quantity,
      this.retries,
      this.endsAt,
      this.amount,
      this.limit,
      this.notes,
      this.updatedAt,
      this.durationMinutes,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a queue review in status open. */
export function newQueueReview(code: string, title: string): QueueReview {
  return new QueueReview(code, title, 0, 0, 0, 0, 0, "", 0, 0, "", "open");
}
