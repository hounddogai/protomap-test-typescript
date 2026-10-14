import * as text from "../../../../kit/text.js";

/** Where a step forecast is in its life cycle. */
export type StepForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A step forecast. Its code is unique within a tenant. */
export class StepForecast {
  code: string;
  title: string;
  version: number;
  durationMinutes: number;
  capacity: number;
  expiresAt: number;
  ceiling: number;
  status: StepForecastStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    durationMinutes: number,
    capacity: number,
    expiresAt: number,
    ceiling: number,
    status: StepForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.durationMinutes = durationMinutes;
    this.capacity = capacity;
    this.expiresAt = expiresAt;
    this.ceiling = ceiling;
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

  canMoveTo(next: StepForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
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

  moveTo(next: StepForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round(this.ceiling * this.expiresAt * 100) / 100;
  }

  copy(): StepForecast {
    return new StepForecast(
      this.code,
      this.title,
      this.version,
      this.durationMinutes,
      this.capacity,
      this.expiresAt,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a step forecast in status idle. */
export function newStepForecast(code: string, title: string): StepForecast {
  return new StepForecast(code, title, 0, 0, 0, 0, 0, "idle");
}
