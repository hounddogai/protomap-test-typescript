import * as text from "../../../../kit/text.js";

/** Where a adaptive cohort estimate is in its life cycle. */
export type AdaptiveCohortEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive cohort estimate as the cohort team keeps it. */
export class AdaptiveCohortEstimate {
  code: string;
  name: string;
  pinned: boolean;
  timezone: string;
  locale: string;
  description: string;
  clicks: number;
  approved: boolean;
  status: AdaptiveCohortEstimateStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    timezone: string,
    locale: string,
    description: string,
    clicks: number,
    approved: boolean,
    status: AdaptiveCohortEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.timezone = timezone;
    this.locale = locale;
    this.description = description;
    this.clicks = clicks;
    this.approved = approved;
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

  canMoveTo(next: AdaptiveCohortEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveCohortEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive cohort estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive cohort estimate"} ${this.code}`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): AdaptiveCohortEstimate {
    return new AdaptiveCohortEstimate(
      this.code,
      this.name,
      this.pinned,
      this.timezone,
      this.locale,
      this.description,
      this.clicks,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive cohort estimate in status proposed. */
export function newAdaptiveCohortEstimate(code: string, name: string): AdaptiveCohortEstimate {
  return new AdaptiveCohortEstimate(code, name, false, "", "", "", 0, false, "proposed");
}
