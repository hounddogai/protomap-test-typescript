import * as text from "../../../../kit/text.js";

/** Where a pending creative forecast is in its life cycle. */
export type PendingCreativeForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending creative forecast, with what the planners need to act on it. */
export class PendingCreativeForecast {
  code: string;
  title: string;
  source: string;
  variant: string;
  ceiling: number;
  notes: string;
  score: number;
  active: boolean;
  segment: string;
  frequencyCap: number;
  limit: number;
  status: PendingCreativeForecastStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    variant: string,
    ceiling: number,
    notes: string,
    score: number,
    active: boolean,
    segment: string,
    frequencyCap: number,
    limit: number,
    status: PendingCreativeForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.variant = variant;
    this.ceiling = ceiling;
    this.notes = notes;
    this.score = score;
    this.active = active;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingCreativeForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCreativeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending creative forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending creative forecast"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.score - this.frequencyCap) * 100) / 100;
  }

  copy(): PendingCreativeForecast {
    return new PendingCreativeForecast(
      this.code,
      this.title,
      this.source,
      this.variant,
      this.ceiling,
      this.notes,
      this.score,
      this.active,
      this.segment,
      this.frequencyCap,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending creative forecast in status new. */
export function newPendingCreativeForecast(code: string, title: string): PendingCreativeForecast {
  return new PendingCreativeForecast(code, title, "", "", 0, "", 0, false, "", 0, 0, "new");
}
