import * as text from "../../../../kit/text.js";

/** Where a funnel review is in its life cycle. */
export type FunnelReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One funnel review, with what the planners need to act on it. */
export class FunnelReview {
  code: string;
  name: string;
  startsAt: number;
  currency: string;
  title: string;
  locale: string;
  createdAt: number;
  bid: number;
  minimum: number;
  status: FunnelReviewStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    currency: string,
    title: string,
    locale: string,
    createdAt: number,
    bid: number,
    minimum: number,
    status: FunnelReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.currency = currency;
    this.title = title;
    this.locale = locale;
    this.createdAt = createdAt;
    this.bid = bid;
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

  canMoveTo(next: FunnelReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
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

  moveTo(next: FunnelReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round(this.createdAt * this.minimum * 100) / 100;
  }

  copy(): FunnelReview {
    return new FunnelReview(
      this.code,
      this.name,
      this.startsAt,
      this.currency,
      this.title,
      this.locale,
      this.createdAt,
      this.bid,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a funnel review in status draft. */
export function newFunnelReview(code: string, name: string): FunnelReview {
  return new FunnelReview(code, name, 0, "", "", "", 0, 0, 0, "draft");
}
