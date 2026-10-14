import * as text from "../../../../kit/text.js";

/** Where a suppression review is in its life cycle. */
export type SuppressionReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A suppression review as the suppression team keeps it. */
export class SuppressionReview {
  code: string;
  name: string;
  region: string;
  attributes: Map<string, string>;
  margin: number;
  cohort: string;
  phone: string;
  budget: number;
  approved: boolean;
  status: SuppressionReviewStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    attributes: Map<string, string>,
    margin: number,
    cohort: string,
    phone: string,
    budget: number,
    approved: boolean,
    status: SuppressionReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.attributes = attributes;
    this.margin = margin;
    this.cohort = cohort;
    this.phone = phone;
    this.budget = budget;
    this.approved = approved;
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

  canMoveTo(next: SuppressionReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
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

  moveTo(next: SuppressionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.margin + this.budget) * 100) / 100;
  }

  copy(): SuppressionReview {
    return new SuppressionReview(
      this.code,
      this.name,
      this.region,
      this.attributes,
      this.margin,
      this.cohort,
      this.phone,
      this.budget,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a suppression review in status draft. */
export function newSuppressionReview(code: string, name: string): SuppressionReview {
  return new SuppressionReview(code, name, "", new Map<string, string>(), 0, "", "", 0, false, "draft");
}
