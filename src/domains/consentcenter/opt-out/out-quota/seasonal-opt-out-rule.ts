import * as text from "../../../../kit/text.js";

/** Where a seasonal opt out rule is in its life cycle. */
export type SeasonalOptOutRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal opt out rule as the opt out team keeps it. */
export class SeasonalOptOutRule {
  code: string;
  name: string;
  approved: boolean;
  score: number;
  startsAt: number;
  batchSize: number;
  attributes: Map<string, string>;
  retries: number;
  updatedAt: number;
  status: SeasonalOptOutRuleStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    score: number,
    startsAt: number,
    batchSize: number,
    attributes: Map<string, string>,
    retries: number,
    updatedAt: number,
    status: SeasonalOptOutRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.score = score;
    this.startsAt = startsAt;
    this.batchSize = batchSize;
    this.attributes = attributes;
    this.retries = retries;
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

  canMoveTo(next: SeasonalOptOutRuleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
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

  moveTo(next: SeasonalOptOutRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal opt out rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round(this.updatedAt * this.retries * 100) / 100;
  }

  copy(): SeasonalOptOutRule {
    return new SeasonalOptOutRule(
      this.code,
      this.name,
      this.approved,
      this.score,
      this.startsAt,
      this.batchSize,
      this.attributes,
      this.retries,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal opt out rule in status open. */
export function newSeasonalOptOutRule(code: string, name: string): SeasonalOptOutRule {
  return new SeasonalOptOutRule(code, name, false, 0, 0, 0, new Map<string, string>(), 0, 0, "open");
}
