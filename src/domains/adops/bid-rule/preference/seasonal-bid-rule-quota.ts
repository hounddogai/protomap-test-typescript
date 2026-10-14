import * as text from "../../../../kit/text.js";

/** Where a seasonal bid rule quota is in its life cycle. */
export type SeasonalBidRuleQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One seasonal bid rule quota, with what the planners need to act on it. */
export class SeasonalBidRuleQuota {
  code: string;
  title: string;
  ceiling: number;
  country: string;
  label: string;
  margin: number;
  status: SeasonalBidRuleQuotaStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    country: string,
    label: string,
    margin: number,
    status: SeasonalBidRuleQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.country = country;
    this.label = label;
    this.margin = margin;
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

  canMoveTo(next: SeasonalBidRuleQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalBidRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal bid rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal bid rule quota"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.ceiling + this.margin) * 100) / 100;
  }

  copy(): SeasonalBidRuleQuota {
    return new SeasonalBidRuleQuota(
      this.code,
      this.title,
      this.ceiling,
      this.country,
      this.label,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal bid rule quota in status proposed. */
export function newSeasonalBidRuleQuota(code: string, title: string): SeasonalBidRuleQuota {
  return new SeasonalBidRuleQuota(code, title, 0, "", "", 0, "proposed");
}
