import * as text from "../../../../kit/text.js";

/** Where a approval review is in its life cycle. */
export type ApprovalReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A approval review as the approval team keeps it. */
export class ApprovalReview {
  code: string;
  title: string;
  currency: string;
  campaignRef: string;
  utmSource: string;
  score: number;
  status: ApprovalReviewStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    campaignRef: string,
    utmSource: string,
    score: number,
    status: ApprovalReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
    this.score = score;
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

  canMoveTo(next: ApprovalReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"approval review"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ApprovalReview {
    return new ApprovalReview(
      this.code,
      this.title,
      this.currency,
      this.campaignRef,
      this.utmSource,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a approval review in status draft. */
export function newApprovalReview(code: string, title: string): ApprovalReview {
  return new ApprovalReview(code, title, "", "", "", 0, "draft");
}
