import * as text from "../../../../kit/text.js";

/** Where a strict branch review is in its life cycle. */
export type StrictBranchReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict branch review, with what the planners need to act on it. */
export class StrictBranchReview {
  code: string;
  title: string;
  locale: string;
  frequencyCap: number;
  impressions: number;
  quantity: number;
  floorValue: number;
  category: string;
  ownerId: string;
  status: StrictBranchReviewStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    frequencyCap: number,
    impressions: number,
    quantity: number,
    floorValue: number,
    category: string,
    ownerId: string,
    status: StrictBranchReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.impressions = impressions;
    this.quantity = quantity;
    this.floorValue = floorValue;
    this.category = category;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictBranchReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictBranchReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict branch review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.floorValue - this.quantity) * 100) / 100;
  }

  copy(): StrictBranchReview {
    return new StrictBranchReview(
      this.code,
      this.title,
      this.locale,
      this.frequencyCap,
      this.impressions,
      this.quantity,
      this.floorValue,
      this.category,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict branch review in status requested. */
export function newStrictBranchReview(code: string, title: string): StrictBranchReview {
  return new StrictBranchReview(code, title, "", 0, 0, 0, 0, "", "", "requested");
}
