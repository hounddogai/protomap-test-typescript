import * as text from "../../../../kit/text.js";

/** Where a tier forecast is in its life cycle. */
export type TierForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tier forecast, with what the planners need to act on it. */
export class TierForecast {
  code: string;
  label: string;
  attempts: number;
  retries: number;
  createdAt: number;
  status: TierForecastStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    retries: number,
    createdAt: number,
    status: TierForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.retries = retries;
    this.createdAt = createdAt;
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

  canMoveTo(next: TierForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TierForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.attempts + this.createdAt) * 100) / 100;
  }

  copy(): TierForecast {
    return new TierForecast(this.code, this.label, this.attempts, this.retries, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tier forecast in status idle. */
export function newTierForecast(code: string, label: string): TierForecast {
  return new TierForecast(code, label, 0, 0, 0, "idle");
}
