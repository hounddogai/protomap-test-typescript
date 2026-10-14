import * as text from "../../../../kit/text.js";

/** Where a lenient complaint review is in its life cycle. */
export type LenientComplaintReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One lenient complaint review, with what the planners need to act on it. */
export class LenientComplaintReview {
  code: string;
  title: string;
  locale: string;
  endsAt: number;
  minimum: number;
  status: LenientComplaintReviewStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    endsAt: number,
    minimum: number,
    status: LenientComplaintReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.endsAt = endsAt;
    this.minimum = minimum;
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

  canMoveTo(next: LenientComplaintReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
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

  moveTo(next: LenientComplaintReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient complaint review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.endsAt - this.minimum) * 100) / 100;
  }

  copy(): LenientComplaintReview {
    return new LenientComplaintReview(this.code, this.title, this.locale, this.endsAt, this.minimum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient complaint review in status draft. */
export function newLenientComplaintReview(code: string, title: string): LenientComplaintReview {
  return new LenientComplaintReview(code, title, "", 0, 0, "draft");
}
