import * as text from "../../../../kit/text.js";

/** Where a complaint forecast is in its life cycle. */
export type ComplaintForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One complaint forecast, with what the planners need to act on it. */
export class ComplaintForecast {
  code: string;
  label: string;
  revision: number;
  unit: string;
  score: number;
  capacity: number;
  discount: number;
  retries: number;
  archived: boolean;
  status: ComplaintForecastStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    unit: string,
    score: number,
    capacity: number,
    discount: number,
    retries: number,
    archived: boolean,
    status: ComplaintForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.unit = unit;
    this.score = score;
    this.capacity = capacity;
    this.discount = discount;
    this.retries = retries;
    this.archived = archived;
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

  canMoveTo(next: ComplaintForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ComplaintForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round(this.retries * this.revision * 100) / 100;
  }

  copy(): ComplaintForecast {
    return new ComplaintForecast(
      this.code,
      this.label,
      this.revision,
      this.unit,
      this.score,
      this.capacity,
      this.discount,
      this.retries,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a complaint forecast in status idle. */
export function newComplaintForecast(code: string, label: string): ComplaintForecast {
  return new ComplaintForecast(code, label, 0, "", 0, 0, 0, 0, false, "idle");
}
