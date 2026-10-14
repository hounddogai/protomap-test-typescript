import * as text from "../../../../kit/text.js";

/** Where a legacy proof review is in its life cycle. */
export type LegacyProofReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A legacy proof review. Its code is unique within a tenant. */
export class LegacyProofReview {
  code: string;
  title: string;
  channel: string;
  amount: number;
  summary: string;
  discount: number;
  maximum: number;
  priority: number;
  status: LegacyProofReviewStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    amount: number,
    summary: string,
    discount: number,
    maximum: number,
    priority: number,
    status: LegacyProofReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.amount = amount;
    this.summary = summary;
    this.discount = discount;
    this.maximum = maximum;
    this.priority = priority;
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

  canMoveTo(next: LegacyProofReviewStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyProofReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy proof review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round(this.discount * this.priority * 100) / 100;
  }

  copy(): LegacyProofReview {
    return new LegacyProofReview(
      this.code,
      this.title,
      this.channel,
      this.amount,
      this.summary,
      this.discount,
      this.maximum,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy proof review in status open. */
export function newLegacyProofReview(code: string, title: string): LegacyProofReview {
  return new LegacyProofReview(code, title, "", 0, "", 0, 0, 0, "open");
}
