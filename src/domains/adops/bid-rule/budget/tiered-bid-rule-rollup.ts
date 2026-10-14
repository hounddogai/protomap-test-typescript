import * as text from "../../../../kit/text.js";

/** Where a tiered bid rule rollup is in its life cycle. */
export type TieredBidRuleRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One tiered bid rule rollup, with what the planners need to act on it. */
export class TieredBidRuleRollup {
  code: string;
  label: string;
  region: string;
  approved: boolean;
  minimum: number;
  category: string;
  utmSource: string;
  budget: number;
  attempts: number;
  margin: number;
  updatedAt: number;
  status: TieredBidRuleRollupStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    approved: boolean,
    minimum: number,
    category: string,
    utmSource: string,
    budget: number,
    attempts: number,
    margin: number,
    updatedAt: number,
    status: TieredBidRuleRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.approved = approved;
    this.minimum = minimum;
    this.category = category;
    this.utmSource = utmSource;
    this.budget = budget;
    this.attempts = attempts;
    this.margin = margin;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: TieredBidRuleRollupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TieredBidRuleRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bid rule rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.margin - this.budget) * 100) / 100;
  }

  copy(): TieredBidRuleRollup {
    return new TieredBidRuleRollup(
      this.code,
      this.label,
      this.region,
      this.approved,
      this.minimum,
      this.category,
      this.utmSource,
      this.budget,
      this.attempts,
      this.margin,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered bid rule rollup in status open. */
export function newTieredBidRuleRollup(code: string, label: string): TieredBidRuleRollup {
  return new TieredBidRuleRollup(code, label, "", false, 0, "", "", 0, 0, 0, 0, "open");
}
