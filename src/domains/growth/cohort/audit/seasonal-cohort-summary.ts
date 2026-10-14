import * as text from "../../../../kit/text.js";

/** Where a seasonal cohort summary is in its life cycle. */
export type SeasonalCohortSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal cohort summary, with what the planners need to act on it. */
export class SeasonalCohortSummary {
  code: string;
  title: string;
  reviewer: string;
  weight: number;
  label: string;
  graceDays: number;
  impressions: number;
  ownerId: string;
  journeyId: string;
  createdAt: number;
  status: SeasonalCohortSummaryStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    weight: number,
    label: string,
    graceDays: number,
    impressions: number,
    ownerId: string,
    journeyId: string,
    createdAt: number,
    status: SeasonalCohortSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.weight = weight;
    this.label = label;
    this.graceDays = graceDays;
    this.impressions = impressions;
    this.ownerId = ownerId;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalCohortSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalCohortSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal cohort summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.weight + this.impressions) * 100) / 100;
  }

  copy(): SeasonalCohortSummary {
    return new SeasonalCohortSummary(
      this.code,
      this.title,
      this.reviewer,
      this.weight,
      this.label,
      this.graceDays,
      this.impressions,
      this.ownerId,
      this.journeyId,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal cohort summary in status idle. */
export function newSeasonalCohortSummary(code: string, title: string): SeasonalCohortSummary {
  return new SeasonalCohortSummary(code, title, "", 0, "", 0, 0, "", "", 0, "idle");
}
