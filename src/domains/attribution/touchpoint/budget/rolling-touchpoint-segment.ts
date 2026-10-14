import * as text from "../../../../kit/text.js";

/** Where a rolling touchpoint segment is in its life cycle. */
export type RollingTouchpointSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling touchpoint segment as the touchpoint team keeps it. */
export class RollingTouchpointSegment {
  code: string;
  name: string;
  threshold: number;
  updatedAt: number;
  timezone: string;
  country: string;
  unit: string;
  bid: number;
  category: string;
  channel: string;
  rate: number;
  status: RollingTouchpointSegmentStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    updatedAt: number,
    timezone: string,
    country: string,
    unit: string,
    bid: number,
    category: string,
    channel: string,
    rate: number,
    status: RollingTouchpointSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.timezone = timezone;
    this.country = country;
    this.unit = unit;
    this.bid = bid;
    this.category = category;
    this.channel = channel;
    this.rate = rate;
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

  canMoveTo(next: RollingTouchpointSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingTouchpointSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling touchpoint segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round(this.bid * this.threshold * 100) / 100;
  }

  copy(): RollingTouchpointSegment {
    return new RollingTouchpointSegment(
      this.code,
      this.name,
      this.threshold,
      this.updatedAt,
      this.timezone,
      this.country,
      this.unit,
      this.bid,
      this.category,
      this.channel,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a rolling touchpoint segment in status idle. */
export function newRollingTouchpointSegment(code: string, name: string): RollingTouchpointSegment {
  return new RollingTouchpointSegment(code, name, 0, 0, "", "", "", 0, "", "", 0, "idle");
}
