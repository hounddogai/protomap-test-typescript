import * as text from "../../../../kit/text.js";

/** Where a seasonal creative summary is in its life cycle. */
export type SeasonalCreativeSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal creative summary, with what the planners need to act on it. */
export class SeasonalCreativeSummary {
  code: string;
  title: string;
  clicks: number;
  attempts: number;
  archived: boolean;
  status: SeasonalCreativeSummaryStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    attempts: number,
    archived: boolean,
    status: SeasonalCreativeSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.attempts = attempts;
    this.archived = archived;
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

  canMoveTo(next: SeasonalCreativeSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SeasonalCreativeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal creative summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal creative summary"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.clicks + this.attempts) * 100) / 100;
  }

  copy(): SeasonalCreativeSummary {
    return new SeasonalCreativeSummary(this.code, this.title, this.clicks, this.attempts, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal creative summary in status open. */
export function newSeasonalCreativeSummary(code: string, title: string): SeasonalCreativeSummary {
  return new SeasonalCreativeSummary(code, title, 0, 0, false, "open");
}
