import * as text from "../../../../kit/text.js";

/** Where a level variance is in its life cycle. */
export type LevelVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One level variance, with what the planners need to act on it. */
export class LevelVariance {
  code: string;
  title: string;
  country: string;
  cost: number;
  attempts: number;
  status: LevelVarianceStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    cost: number,
    attempts: number,
    status: LevelVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.cost = cost;
    this.attempts = attempts;
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

  canMoveTo(next: LevelVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round(this.attempts * this.cost * 100) / 100;
  }

  copy(): LevelVariance {
    return new LevelVariance(this.code, this.title, this.country, this.cost, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a level variance in status open. */
export function newLevelVariance(code: string, title: string): LevelVariance {
  return new LevelVariance(code, title, "", 0, 0, "open");
}
