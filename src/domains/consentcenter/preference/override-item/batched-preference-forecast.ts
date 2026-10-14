import * as text from "../../../../kit/text.js";

/** Where a batched preference forecast is in its life cycle. */
export type BatchedPreferenceForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a batched preference forecast and its current status. */
export class BatchedPreferenceForecast {
  code: string;
  label: string;
  pinned: boolean;
  score: number;
  threshold: number;
  timezone: string;
  phone: string;
  segment: string;
  version: number;
  margin: number;
  status: BatchedPreferenceForecastStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    score: number,
    threshold: number,
    timezone: string,
    phone: string,
    segment: string,
    version: number,
    margin: number,
    status: BatchedPreferenceForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.score = score;
    this.threshold = threshold;
    this.timezone = timezone;
    this.phone = phone;
    this.segment = segment;
    this.version = version;
    this.margin = margin;
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

  canMoveTo(next: BatchedPreferenceForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
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

  moveTo(next: BatchedPreferenceForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched preference forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"batched preference forecast"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.threshold - this.margin) * 100) / 100;
  }

  copy(): BatchedPreferenceForecast {
    return new BatchedPreferenceForecast(
      this.code,
      this.label,
      this.pinned,
      this.score,
      this.threshold,
      this.timezone,
      this.phone,
      this.segment,
      this.version,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched preference forecast in status open. */
export function newBatchedPreferenceForecast(code: string, label: string): BatchedPreferenceForecast {
  return new BatchedPreferenceForecast(code, label, false, 0, 0, "", "", "", 0, 0, "open");
}
