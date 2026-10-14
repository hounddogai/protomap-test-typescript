import * as text from "../../../../kit/text.js";

/** Where a adaptive level forecast is in its life cycle. */
export type AdaptiveLevelForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive level forecast. Its code is unique within a tenant. */
export class AdaptiveLevelForecast {
  code: string;
  name: string;
  version: number;
  archived: boolean;
  limit: number;
  active: boolean;
  region: string;
  minimum: number;
  status: AdaptiveLevelForecastStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    archived: boolean,
    limit: number,
    active: boolean,
    region: string,
    minimum: number,
    status: AdaptiveLevelForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.archived = archived;
    this.limit = limit;
    this.active = active;
    this.region = region;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveLevelForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveLevelForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive level forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"adaptive level forecast"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.version - this.minimum) * 100) / 100;
  }

  copy(): AdaptiveLevelForecast {
    return new AdaptiveLevelForecast(
      this.code,
      this.name,
      this.version,
      this.archived,
      this.limit,
      this.active,
      this.region,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive level forecast in status draft. */
export function newAdaptiveLevelForecast(code: string, name: string): AdaptiveLevelForecast {
  return new AdaptiveLevelForecast(code, name, 0, false, 0, false, "", 0, "draft");
}
