import * as text from "../../../../kit/text.js";

/** Where a regional suppression review is in its life cycle. */
export type RegionalSuppressionReviewStatus = "created" | "validated" | "published" | "retired";

/** A regional suppression review. Its code is unique within a tenant. */
export class RegionalSuppressionReview {
  code: string;
  name: string;
  bid: number;
  updatedAt: number;
  contactEmail: string;
  summary: string;
  conversionRate: number;
  rate: number;
  status: RegionalSuppressionReviewStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    updatedAt: number,
    contactEmail: string,
    summary: string,
    conversionRate: number,
    rate: number,
    status: RegionalSuppressionReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.updatedAt = updatedAt;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.conversionRate = conversionRate;
    this.rate = rate;
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

  canMoveTo(next: RegionalSuppressionReviewStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSuppressionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional suppression review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.rate + this.bid) * 100) / 100;
  }

  copy(): RegionalSuppressionReview {
    return new RegionalSuppressionReview(
      this.code,
      this.name,
      this.bid,
      this.updatedAt,
      this.contactEmail,
      this.summary,
      this.conversionRate,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional suppression review in status created. */
export function newRegionalSuppressionReview(code: string, name: string): RegionalSuppressionReview {
  return new RegionalSuppressionReview(code, name, 0, 0, "", "", 0, 0, "created");
}
