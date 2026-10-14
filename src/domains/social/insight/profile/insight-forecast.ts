import * as text from "../../../../kit/text.js";

/** Where a insight forecast is in its life cycle. */
export type InsightForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A insight forecast as the insight team keeps it. */
export class InsightForecast {
  code: string;
  name: string;
  budget: number;
  windowDays: number;
  label: string;
  notes: string;
  audienceId: string;
  status: InsightForecastStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    windowDays: number,
    label: string,
    notes: string,
    audienceId: string,
    status: InsightForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.windowDays = windowDays;
    this.label = label;
    this.notes = notes;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"insight forecast"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.windowDays * this.budget * 100) / 100;
  }

  copy(): InsightForecast {
    return new InsightForecast(
      this.code,
      this.name,
      this.budget,
      this.windowDays,
      this.label,
      this.notes,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a insight forecast in status planned. */
export function newInsightForecast(code: string, name: string): InsightForecast {
  return new InsightForecast(code, name, 0, 0, "", "", "", "planned");
}
