import * as text from "../../../../kit/text.js";

/** Where a seasonal cohort rollup is in its life cycle. */
export type SeasonalCohortRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a seasonal cohort rollup and its current status. */
export class SeasonalCohortRollup {
  code: string;
  name: string;
  journeyId: string;
  channel: string;
  summary: string;
  reviewer: string;
  updatedAt: number;
  region: string;
  status: SeasonalCohortRollupStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    channel: string,
    summary: string,
    reviewer: string,
    updatedAt: number,
    region: string,
    status: SeasonalCohortRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.channel = channel;
    this.summary = summary;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.region = region;
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

  canMoveTo(next: SeasonalCohortRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalCohortRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal cohort rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): SeasonalCohortRollup {
    return new SeasonalCohortRollup(
      this.code,
      this.name,
      this.journeyId,
      this.channel,
      this.summary,
      this.reviewer,
      this.updatedAt,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal cohort rollup in status proposed. */
export function newSeasonalCohortRollup(code: string, name: string): SeasonalCohortRollup {
  return new SeasonalCohortRollup(code, name, "", "", "", "", 0, "", "proposed");
}
