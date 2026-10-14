import * as text from "../../../../kit/text.js";

/** Where a seasonal paywall review is in its life cycle. */
export type SeasonalPaywallReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal paywall review, with what the planners need to act on it. */
export class SeasonalPaywallReview {
  code: string;
  name: string;
  maximum: number;
  notes: string;
  source: string;
  limit: number;
  status: SeasonalPaywallReviewStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    notes: string,
    source: string,
    limit: number,
    status: SeasonalPaywallReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.notes = notes;
    this.source = source;
    this.limit = limit;
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

  canMoveTo(next: SeasonalPaywallReviewStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: SeasonalPaywallReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal paywall review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedTotal(): number {
    return Math.round((this.limit - this.maximum) * 100) / 100;
  }

  copy(): SeasonalPaywallReview {
    return new SeasonalPaywallReview(
      this.code,
      this.name,
      this.maximum,
      this.notes,
      this.source,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal paywall review in status open. */
export function newSeasonalPaywallReview(code: string, name: string): SeasonalPaywallReview {
  return new SeasonalPaywallReview(code, name, 0, "", "", 0, "open");
}
