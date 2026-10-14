import * as text from "../../../../kit/text.js";

/** Where a weighted placement estimate is in its life cycle. */
export type WeightedPlacementEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted placement estimate. Its code is unique within a tenant. */
export class WeightedPlacementEstimate {
  code: string;
  title: string;
  timezone: string;
  startsAt: number;
  minimum: number;
  journeyId: string;
  expiresAt: number;
  locale: string;
  windowDays: number;
  quantity: number;
  batchSize: number;
  status: WeightedPlacementEstimateStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    startsAt: number,
    minimum: number,
    journeyId: string,
    expiresAt: number,
    locale: string,
    windowDays: number,
    quantity: number,
    batchSize: number,
    status: WeightedPlacementEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.batchSize = batchSize;
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

  canMoveTo(next: WeightedPlacementEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedPlacementEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted placement estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.expiresAt - this.quantity) * 100) / 100;
  }

  copy(): WeightedPlacementEstimate {
    return new WeightedPlacementEstimate(
      this.code,
      this.title,
      this.timezone,
      this.startsAt,
      this.minimum,
      this.journeyId,
      this.expiresAt,
      this.locale,
      this.windowDays,
      this.quantity,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted placement estimate in status idle. */
export function newWeightedPlacementEstimate(code: string, title: string): WeightedPlacementEstimate {
  return new WeightedPlacementEstimate(code, title, "", 0, 0, "", 0, "", 0, 0, 0, "idle");
}
