import * as text from "../../../../kit/text.js";

/** Where a primary exit rule review is in its life cycle. */
export type PrimaryExitRuleReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary exit rule review. Its code is unique within a tenant. */
export class PrimaryExitRuleReview {
  code: string;
  name: string;
  ownerId: string;
  ceiling: number;
  ratio: number;
  status: PrimaryExitRuleReviewStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    ceiling: number,
    ratio: number,
    status: PrimaryExitRuleReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.ratio = ratio;
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

  canMoveTo(next: PrimaryExitRuleReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryExitRuleReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary exit rule review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary exit rule review"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.ceiling * this.ratio * 100) / 100;
  }

  copy(): PrimaryExitRuleReview {
    return new PrimaryExitRuleReview(this.code, this.name, this.ownerId, this.ceiling, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary exit rule review in status draft. */
export function newPrimaryExitRuleReview(code: string, name: string): PrimaryExitRuleReview {
  return new PrimaryExitRuleReview(code, name, "", 0, 0, "draft");
}
