import * as text from "../../../../kit/text.js";

/** Where a touchpoint forecast is in its life cycle. */
export type TouchpointForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A touchpoint forecast as the touchpoint team keeps it. */
export class TouchpointForecast {
  code: string;
  title: string;
  channel: string;
  threshold: number;
  campaignRef: string;
  floorValue: number;
  status: TouchpointForecastStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    threshold: number,
    campaignRef: string,
    floorValue: number,
    status: TouchpointForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.floorValue = floorValue;
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

  canMoveTo(next: TouchpointForecastStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.floorValue + this.threshold) * 100) / 100;
  }

  copy(): TouchpointForecast {
    return new TouchpointForecast(
      this.code,
      this.title,
      this.channel,
      this.threshold,
      this.campaignRef,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a touchpoint forecast in status new. */
export function newTouchpointForecast(code: string, title: string): TouchpointForecast {
  return new TouchpointForecast(code, title, "", 0, "", 0, "new");
}
