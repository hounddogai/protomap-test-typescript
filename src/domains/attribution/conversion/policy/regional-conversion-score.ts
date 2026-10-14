import * as text from "../../../../kit/text.js";

/** Where a regional conversion score is in its life cycle. */
export type RegionalConversionScoreStatus = "created" | "validated" | "published" | "retired";

/** One regional conversion score, with what the planners need to act on it. */
export class RegionalConversionScore {
  code: string;
  label: string;
  summary: string;
  windowDays: number;
  limit: number;
  updatedAt: number;
  notes: string;
  graceDays: number;
  status: RegionalConversionScoreStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    windowDays: number,
    limit: number,
    updatedAt: number,
    notes: string,
    graceDays: number,
    status: RegionalConversionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.windowDays = windowDays;
    this.limit = limit;
    this.updatedAt = updatedAt;
    this.notes = notes;
    this.graceDays = graceDays;
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

  canMoveTo(next: RegionalConversionScoreStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalConversionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional conversion score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round((this.limit - this.graceDays) * 100) / 100;
  }

  copy(): RegionalConversionScore {
    return new RegionalConversionScore(
      this.code,
      this.label,
      this.summary,
      this.windowDays,
      this.limit,
      this.updatedAt,
      this.notes,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional conversion score in status created. */
export function newRegionalConversionScore(code: string, label: string): RegionalConversionScore {
  return new RegionalConversionScore(code, label, "", 0, 0, 0, "", 0, "created");
}
