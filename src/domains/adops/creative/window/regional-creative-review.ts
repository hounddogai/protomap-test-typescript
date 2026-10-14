import * as text from "../../../../kit/text.js";

/** Where a regional creative review is in its life cycle. */
export type RegionalCreativeReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional creative review as the creative team keeps it. */
export class RegionalCreativeReview {
  code: string;
  title: string;
  endsAt: number;
  phone: string;
  limit: number;
  retries: number;
  ceiling: number;
  floorValue: number;
  status: RegionalCreativeReviewStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    phone: string,
    limit: number,
    retries: number,
    ceiling: number,
    floorValue: number,
    status: RegionalCreativeReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.phone = phone;
    this.limit = limit;
    this.retries = retries;
    this.ceiling = ceiling;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalCreativeReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalCreativeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional creative review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional creative review"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.retries + this.floorValue) * 100) / 100;
  }

  copy(): RegionalCreativeReview {
    return new RegionalCreativeReview(
      this.code,
      this.title,
      this.endsAt,
      this.phone,
      this.limit,
      this.retries,
      this.ceiling,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional creative review in status planned. */
export function newRegionalCreativeReview(code: string, title: string): RegionalCreativeReview {
  return new RegionalCreativeReview(code, title, 0, "", 0, 0, 0, 0, "planned");
}
