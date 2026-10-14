import * as text from "../../../../kit/text.js";

/** Where a insight baseline is in its life cycle. */
export type InsightBaselineStatus = "created" | "validated" | "published" | "retired";

/** A insight baseline as the insight team keeps it. */
export class InsightBaseline {
  code: string;
  name: string;
  reviewer: string;
  limit: number;
  country: string;
  status: InsightBaselineStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    limit: number,
    country: string,
    status: InsightBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.limit = limit;
    this.country = country;
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

  canMoveTo(next: InsightBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight baseline"} ${this.code}`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): InsightBaseline {
    return new InsightBaseline(this.code, this.name, this.reviewer, this.limit, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a insight baseline in status created. */
export function newInsightBaseline(code: string, name: string): InsightBaseline {
  return new InsightBaseline(code, name, "", 0, "", "created");
}
