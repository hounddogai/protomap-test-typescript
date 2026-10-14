import * as text from "../../../../kit/text.js";

/** Where a warmup forecast is in its life cycle. */
export type WarmupForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A warmup forecast. Its code is unique within a tenant. */
export class WarmupForecast {
  code: string;
  label: string;
  attempts: number;
  ownerId: string;
  phone: string;
  capacity: number;
  ceiling: number;
  reviewer: string;
  status: WarmupForecastStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    ownerId: string,
    phone: string,
    capacity: number,
    ceiling: number,
    reviewer: string,
    status: WarmupForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.ownerId = ownerId;
    this.phone = phone;
    this.capacity = capacity;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
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

  canMoveTo(next: WarmupForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: WarmupForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"warmup forecast"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.ceiling * this.capacity * 100) / 100;
  }

  copy(): WarmupForecast {
    return new WarmupForecast(
      this.code,
      this.label,
      this.attempts,
      this.ownerId,
      this.phone,
      this.capacity,
      this.ceiling,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a warmup forecast in status planned. */
export function newWarmupForecast(code: string, label: string): WarmupForecast {
  return new WarmupForecast(code, label, 0, "", "", 0, 0, "", "planned");
}
