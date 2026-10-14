import * as text from "../../../../kit/text.js";

/** Where a fallback branch review is in its life cycle. */
export type FallbackBranchReviewStatus = "created" | "validated" | "published" | "retired";

/** A fallback branch review as the branch team keeps it. */
export class FallbackBranchReview {
  code: string;
  name: string;
  contactEmail: string;
  reviewer: string;
  floorValue: number;
  threshold: number;
  budget: number;
  status: FallbackBranchReviewStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    reviewer: string,
    floorValue: number,
    threshold: number,
    budget: number,
    status: FallbackBranchReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.threshold = threshold;
    this.budget = budget;
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

  canMoveTo(next: FallbackBranchReviewStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackBranchReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback branch review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.floorValue - this.threshold) * 100) / 100;
  }

  copy(): FallbackBranchReview {
    return new FallbackBranchReview(
      this.code,
      this.name,
      this.contactEmail,
      this.reviewer,
      this.floorValue,
      this.threshold,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback branch review in status created. */
export function newFallbackBranchReview(code: string, name: string): FallbackBranchReview {
  return new FallbackBranchReview(code, name, "", "", 0, 0, 0, "created");
}
