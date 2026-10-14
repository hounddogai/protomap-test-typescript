/**
 * The global pacing review records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global pacing review is in its life cycle. */
export type GlobalPacingReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global pacing review and its current status. */
export class GlobalPacingReview {
  code: string;
  title: string;
  externalRef: string;
  ratio: number;
  graceDays: number;
  updatedAt: number;
  budget: number;
  status: GlobalPacingReviewStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    ratio: number,
    graceDays: number,
    updatedAt: number,
    budget: number,
    status: GlobalPacingReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.budget = budget;
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

  canMoveTo(next: GlobalPacingReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended";
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

  moveTo(next: GlobalPacingReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global pacing review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.updatedAt + this.graceDays) * 100) / 100;
  }

  copy(): GlobalPacingReview {
    return new GlobalPacingReview(
      this.code,
      this.title,
      this.externalRef,
      this.ratio,
      this.graceDays,
      this.updatedAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global pacing review in status draft. */
export function newGlobalPacingReview(code: string, title: string): GlobalPacingReview {
  return new GlobalPacingReview(code, title, "", 0, 0, 0, 0, "draft");
}
