import * as text from "../../../../kit/text.js";

/** Where a reputation forecast is in its life cycle. */
export type ReputationForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reputation forecast as the reputation team keeps it. */
export class ReputationForecast {
  code: string;
  title: string;
  durationMinutes: number;
  variant: string;
  locale: string;
  timezone: string;
  expiresAt: number;
  notes: string;
  batchSize: number;
  status: ReputationForecastStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    variant: string,
    locale: string,
    timezone: string,
    expiresAt: number,
    notes: string,
    batchSize: number,
    status: ReputationForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.locale = locale;
    this.timezone = timezone;
    this.expiresAt = expiresAt;
    this.notes = notes;
    this.batchSize = batchSize;
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

  canMoveTo(next: ReputationForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "cancelled":
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
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ReputationForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.expiresAt * this.batchSize * 100) / 100;
  }

  copy(): ReputationForecast {
    return new ReputationForecast(
      this.code,
      this.title,
      this.durationMinutes,
      this.variant,
      this.locale,
      this.timezone,
      this.expiresAt,
      this.notes,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reputation forecast in status planned. */
export function newReputationForecast(code: string, title: string): ReputationForecast {
  return new ReputationForecast(code, title, 0, "", "", "", 0, "", 0, "planned");
}
