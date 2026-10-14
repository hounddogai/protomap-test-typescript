import * as text from "../../../../kit/text.js";

/** Where a default sla forecast is in its life cycle. */
export type DefaultSlaForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One default sla forecast, with what the planners need to act on it. */
export class DefaultSlaForecast {
  code: string;
  label: string;
  openRate: number;
  active: boolean;
  score: number;
  capacity: number;
  status: DefaultSlaForecastStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    active: boolean,
    score: number,
    capacity: number,
    status: DefaultSlaForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.active = active;
    this.score = score;
    this.capacity = capacity;
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

  canMoveTo(next: DefaultSlaForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DefaultSlaForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sla forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.openRate + this.capacity) * 100) / 100;
  }

  copy(): DefaultSlaForecast {
    return new DefaultSlaForecast(
      this.code,
      this.label,
      this.openRate,
      this.active,
      this.score,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default sla forecast in status idle. */
export function newDefaultSlaForecast(code: string, label: string): DefaultSlaForecast {
  return new DefaultSlaForecast(code, label, 0, false, 0, 0, "idle");
}
