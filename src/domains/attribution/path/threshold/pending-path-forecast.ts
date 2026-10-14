import * as text from "../../../../kit/text.js";

/** Where a pending path forecast is in its life cycle. */
export type PendingPathForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending path forecast as the path team keeps it. */
export class PendingPathForecast {
  code: string;
  label: string;
  windowDays: number;
  cohort: string;
  notes: string;
  graceDays: number;
  threshold: number;
  sequence: number;
  externalRef: string;
  expiresAt: number;
  status: PendingPathForecastStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    cohort: string,
    notes: string,
    graceDays: number,
    threshold: number,
    sequence: number,
    externalRef: string,
    expiresAt: number,
    status: PendingPathForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.cohort = cohort;
    this.notes = notes;
    this.graceDays = graceDays;
    this.threshold = threshold;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: PendingPathForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingPathForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending path forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.expiresAt + this.threshold) * 100) / 100;
  }

  copy(): PendingPathForecast {
    return new PendingPathForecast(
      this.code,
      this.label,
      this.windowDays,
      this.cohort,
      this.notes,
      this.graceDays,
      this.threshold,
      this.sequence,
      this.externalRef,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending path forecast in status proposed. */
export function newPendingPathForecast(code: string, label: string): PendingPathForecast {
  return new PendingPathForecast(code, label, 0, "", "", 0, 0, 0, "", 0, "proposed");
}
