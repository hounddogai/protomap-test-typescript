import * as text from "../../../../kit/text.js";

/** Where a warmup review is in its life cycle. */
export type WarmupReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A warmup review. Its code is unique within a tenant. */
export class WarmupReview {
  code: string;
  title: string;
  ratio: number;
  expiresAt: number;
  openRate: number;
  status: WarmupReviewStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    expiresAt: number,
    openRate: number,
    status: WarmupReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupReviewStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round(this.ratio * this.expiresAt * 100) / 100;
  }

  copy(): WarmupReview {
    return new WarmupReview(this.code, this.title, this.ratio, this.expiresAt, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a warmup review in status open. */
export function newWarmupReview(code: string, title: string): WarmupReview {
  return new WarmupReview(code, title, 0, 0, 0, "open");
}
