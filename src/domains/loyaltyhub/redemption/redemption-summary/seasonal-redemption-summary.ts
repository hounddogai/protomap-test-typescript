/**
 * The seasonal redemption summary records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal redemption summary is in its life cycle. */
export type SeasonalRedemptionSummaryStatus = "created" | "validated" | "published" | "retired";

/** One seasonal redemption summary, with what the planners need to act on it. */
export class SeasonalRedemptionSummary {
  code: string;
  title: string;
  journeyId: string;
  ratio: number;
  category: string;
  status: SeasonalRedemptionSummaryStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    ratio: number,
    category: string,
    status: SeasonalRedemptionSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.ratio = ratio;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalRedemptionSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SeasonalRedemptionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal redemption summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal redemption summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): SeasonalRedemptionSummary {
    return new SeasonalRedemptionSummary(this.code, this.title, this.journeyId, this.ratio, this.category, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal redemption summary in status created. */
export function newSeasonalRedemptionSummary(code: string, title: string): SeasonalRedemptionSummary {
  return new SeasonalRedemptionSummary(code, title, "", 0, "", "created");
}
