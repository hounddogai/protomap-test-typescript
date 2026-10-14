import * as text from "../../../../kit/text.js";

/** Where a seasonal post override is in its life cycle. */
export type SeasonalPostOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal post override, with what the planners need to act on it. */
export class SeasonalPostOverride {
  code: string;
  name: string;
  region: string;
  summary: string;
  amount: number;
  conversionRate: number;
  status: SeasonalPostOverrideStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    summary: string,
    amount: number,
    conversionRate: number,
    status: SeasonalPostOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.summary = summary;
    this.amount = amount;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: SeasonalPostOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: SeasonalPostOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal post override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal post override"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.conversionRate + this.amount) * 100) / 100;
  }

  copy(): SeasonalPostOverride {
    return new SeasonalPostOverride(
      this.code,
      this.name,
      this.region,
      this.summary,
      this.amount,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal post override in status open. */
export function newSeasonalPostOverride(code: string, name: string): SeasonalPostOverride {
  return new SeasonalPostOverride(code, name, "", "", 0, 0, "open");
}
