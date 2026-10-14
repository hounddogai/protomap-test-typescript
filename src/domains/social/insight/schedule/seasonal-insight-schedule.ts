import * as text from "../../../../kit/text.js";

/** Where a seasonal insight schedule is in its life cycle. */
export type SeasonalInsightScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a seasonal insight schedule and its current status. */
export class SeasonalInsightSchedule {
  code: string;
  title: string;
  name: string;
  batchSize: number;
  amount: number;
  threshold: number;
  floorValue: number;
  margin: number;
  limit: number;
  approved: boolean;
  score: number;
  status: SeasonalInsightScheduleStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    batchSize: number,
    amount: number,
    threshold: number,
    floorValue: number,
    margin: number,
    limit: number,
    approved: boolean,
    score: number,
    status: SeasonalInsightScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.batchSize = batchSize;
    this.amount = amount;
    this.threshold = threshold;
    this.floorValue = floorValue;
    this.margin = margin;
    this.limit = limit;
    this.approved = approved;
    this.score = score;
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

  canMoveTo(next: SeasonalInsightScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalInsightScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal insight schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.limit * this.batchSize * 100) / 100;
  }

  copy(): SeasonalInsightSchedule {
    return new SeasonalInsightSchedule(
      this.code,
      this.title,
      this.name,
      this.batchSize,
      this.amount,
      this.threshold,
      this.floorValue,
      this.margin,
      this.limit,
      this.approved,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal insight schedule in status idle. */
export function newSeasonalInsightSchedule(code: string, title: string): SeasonalInsightSchedule {
  return new SeasonalInsightSchedule(code, title, "", 0, 0, 0, 0, 0, 0, false, 0, "idle");
}
