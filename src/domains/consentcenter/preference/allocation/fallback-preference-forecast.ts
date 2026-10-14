import * as text from "../../../../kit/text.js";

/** Where a fallback preference forecast is in its life cycle. */
export type FallbackPreferenceForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback preference forecast and its current status. */
export class FallbackPreferenceForecast {
  code: string;
  label: string;
  quantity: number;
  contactEmail: string;
  archived: boolean;
  threshold: number;
  windowDays: number;
  active: boolean;
  retries: number;
  status: FallbackPreferenceForecastStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    contactEmail: string,
    archived: boolean,
    threshold: number,
    windowDays: number,
    active: boolean,
    retries: number,
    status: FallbackPreferenceForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.archived = archived;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.active = active;
    this.retries = retries;
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

  canMoveTo(next: FallbackPreferenceForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackPreferenceForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback preference forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback preference forecast"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.windowDays - this.retries) * 100) / 100;
  }

  copy(): FallbackPreferenceForecast {
    return new FallbackPreferenceForecast(
      this.code,
      this.label,
      this.quantity,
      this.contactEmail,
      this.archived,
      this.threshold,
      this.windowDays,
      this.active,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback preference forecast in status new. */
export function newFallbackPreferenceForecast(code: string, label: string): FallbackPreferenceForecast {
  return new FallbackPreferenceForecast(code, label, 0, "", false, 0, 0, false, 0, "new");
}
