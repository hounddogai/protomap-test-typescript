import * as text from "../../../../kit/text.js";

/** Where a rolling nudge review is in its life cycle. */
export type RollingNudgeReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One rolling nudge review, with what the planners need to act on it. */
export class RollingNudgeReview {
  code: string;
  label: string;
  margin: number;
  variant: string;
  region: string;
  status: RollingNudgeReviewStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    variant: string,
    region: string,
    status: RollingNudgeReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.variant = variant;
    this.region = region;
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

  canMoveTo(next: RollingNudgeReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingNudgeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): RollingNudgeReview {
    return new RollingNudgeReview(this.code, this.label, this.margin, this.variant, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling nudge review in status requested. */
export function newRollingNudgeReview(code: string, label: string): RollingNudgeReview {
  return new RollingNudgeReview(code, label, 0, "", "", "requested");
}
