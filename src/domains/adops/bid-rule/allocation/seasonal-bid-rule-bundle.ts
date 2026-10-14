import * as text from "../../../../kit/text.js";

/** Where a seasonal bid rule bundle is in its life cycle. */
export type SeasonalBidRuleBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal bid rule bundle, with what the planners need to act on it. */
export class SeasonalBidRuleBundle {
  code: string;
  name: string;
  locale: string;
  maximum: number;
  conversionRate: number;
  amount: number;
  status: SeasonalBidRuleBundleStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    maximum: number,
    conversionRate: number,
    amount: number,
    status: SeasonalBidRuleBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.maximum = maximum;
    this.conversionRate = conversionRate;
    this.amount = amount;
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

  canMoveTo(next: SeasonalBidRuleBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalBidRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal bid rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal bid rule bundle"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.conversionRate - this.maximum) * 100) / 100;
  }

  copy(): SeasonalBidRuleBundle {
    return new SeasonalBidRuleBundle(
      this.code,
      this.name,
      this.locale,
      this.maximum,
      this.conversionRate,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal bid rule bundle in status draft. */
export function newSeasonalBidRuleBundle(code: string, name: string): SeasonalBidRuleBundle {
  return new SeasonalBidRuleBundle(code, name, "", 0, 0, 0, "draft");
}
