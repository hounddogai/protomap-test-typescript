import * as text from "../../../../kit/text.js";

/** Where a regional enrollment review is in its life cycle. */
export type RegionalEnrollmentReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One regional enrollment review, with what the planners need to act on it. */
export class RegionalEnrollmentReview {
  code: string;
  title: string;
  minimum: number;
  createdAt: number;
  conversionRate: number;
  unit: string;
  attributes: Map<string, string>;
  checksum: string;
  ceiling: number;
  status: RegionalEnrollmentReviewStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    createdAt: number,
    conversionRate: number,
    unit: string,
    attributes: Map<string, string>,
    checksum: string,
    ceiling: number,
    status: RegionalEnrollmentReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
    this.unit = unit;
    this.attributes = attributes;
    this.checksum = checksum;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalEnrollmentReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalEnrollmentReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional enrollment review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.minimum - this.conversionRate) * 100) / 100;
  }

  copy(): RegionalEnrollmentReview {
    return new RegionalEnrollmentReview(
      this.code,
      this.title,
      this.minimum,
      this.createdAt,
      this.conversionRate,
      this.unit,
      this.attributes,
      this.checksum,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a regional enrollment review in status proposed. */
export function newRegionalEnrollmentReview(code: string, title: string): RegionalEnrollmentReview {
  return new RegionalEnrollmentReview(code, title, 0, 0, 0, "", new Map<string, string>(), "", 0, "proposed");
}
