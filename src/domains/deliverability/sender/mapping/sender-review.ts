import * as text from "../../../../kit/text.js";

/** Where a sender review is in its life cycle. */
export type SenderReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A sender review as the sender team keeps it. */
export class SenderReview {
  code: string;
  name: string;
  discount: number;
  ratio: number;
  reviewer: string;
  timezone: string;
  updatedAt: number;
  sendAt: number;
  minimum: number;
  variant: string;
  status: SenderReviewStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    ratio: number,
    reviewer: string,
    timezone: string,
    updatedAt: number,
    sendAt: number,
    minimum: number,
    variant: string,
    status: SenderReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.ratio = ratio;
    this.reviewer = reviewer;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.minimum = minimum;
    this.variant = variant;
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

  canMoveTo(next: SenderReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedValue(): number {
    return Math.round((this.minimum + this.sendAt) * 100) / 100;
  }

  copy(): SenderReview {
    return new SenderReview(
      this.code,
      this.name,
      this.discount,
      this.ratio,
      this.reviewer,
      this.timezone,
      this.updatedAt,
      this.sendAt,
      this.minimum,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sender review in status new. */
export function newSenderReview(code: string, name: string): SenderReview {
  return new SenderReview(code, name, 0, 0, "", "", 0, 0, 0, "", "new");
}
