import * as text from "../../../../kit/text.js";

/** Where a fallback bounce baseline is in its life cycle. */
export type FallbackBounceBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback bounce baseline, with what the planners need to act on it. */
export class FallbackBounceBaseline {
  code: string;
  title: string;
  pinned: boolean;
  approved: boolean;
  utmSource: string;
  maximum: number;
  conversionRate: number;
  clicks: number;
  status: FallbackBounceBaselineStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    approved: boolean,
    utmSource: string,
    maximum: number,
    conversionRate: number,
    clicks: number,
    status: FallbackBounceBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.approved = approved;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.conversionRate = conversionRate;
    this.clicks = clicks;
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

  canMoveTo(next: FallbackBounceBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackBounceBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bounce baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback bounce baseline"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.maximum + this.clicks) * 100) / 100;
  }

  copy(): FallbackBounceBaseline {
    return new FallbackBounceBaseline(
      this.code,
      this.title,
      this.pinned,
      this.approved,
      this.utmSource,
      this.maximum,
      this.conversionRate,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback bounce baseline in status open. */
export function newFallbackBounceBaseline(code: string, title: string): FallbackBounceBaseline {
  return new FallbackBounceBaseline(code, title, false, false, "", 0, 0, 0, "open");
}
