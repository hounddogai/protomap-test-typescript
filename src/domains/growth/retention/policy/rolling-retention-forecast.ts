import * as text from "../../../../kit/text.js";

/** Where a rolling retention forecast is in its life cycle. */
export type RollingRetentionForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** One rolling retention forecast, with what the planners need to act on it. */
export class RollingRetentionForecast {
  code: string;
  label: string;
  budget: number;
  impressions: number;
  revision: number;
  status: RollingRetentionForecastStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    impressions: number,
    revision: number,
    status: RollingRetentionForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.impressions = impressions;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingRetentionForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingRetentionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling retention forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedValue(): number {
    return Math.round((this.revision + this.budget) * 100) / 100;
  }

  copy(): RollingRetentionForecast {
    return new RollingRetentionForecast(
      this.code,
      this.label,
      this.budget,
      this.impressions,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling retention forecast in status requested. */
export function newRollingRetentionForecast(code: string, label: string): RollingRetentionForecast {
  return new RollingRetentionForecast(code, label, 0, 0, 0, "requested");
}
