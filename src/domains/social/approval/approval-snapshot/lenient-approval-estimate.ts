import * as text from "../../../../kit/text.js";

/** Where a lenient approval estimate is in its life cycle. */
export type LenientApprovalEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient approval estimate as the approval team keeps it. */
export class LenientApprovalEstimate {
  code: string;
  title: string;
  locale: string;
  startsAt: number;
  country: string;
  margin: number;
  status: LenientApprovalEstimateStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    startsAt: number,
    country: string,
    margin: number,
    status: LenientApprovalEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.startsAt = startsAt;
    this.country = country;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientApprovalEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientApprovalEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient approval estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.startsAt - this.margin) * 100) / 100;
  }

  copy(): LenientApprovalEstimate {
    return new LenientApprovalEstimate(
      this.code,
      this.title,
      this.locale,
      this.startsAt,
      this.country,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient approval estimate in status new. */
export function newLenientApprovalEstimate(code: string, title: string): LenientApprovalEstimate {
  return new LenientApprovalEstimate(code, title, "", 0, "", 0, "new");
}
