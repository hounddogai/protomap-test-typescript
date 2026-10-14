import * as text from "../../../../kit/text.js";

/** Where a scheduled touchpoint segment is in its life cycle. */
export type ScheduledTouchpointSegmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled touchpoint segment and its current status. */
export class ScheduledTouchpointSegment {
  code: string;
  title: string;
  cost: number;
  timezone: string;
  minimum: number;
  region: string;
  clicks: number;
  visible: boolean;
  endsAt: number;
  priority: number;
  status: ScheduledTouchpointSegmentStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    timezone: string,
    minimum: number,
    region: string,
    clicks: number,
    visible: boolean,
    endsAt: number,
    priority: number,
    status: ScheduledTouchpointSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.timezone = timezone;
    this.minimum = minimum;
    this.region = region;
    this.clicks = clicks;
    this.visible = visible;
    this.endsAt = endsAt;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledTouchpointSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledTouchpointSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled touchpoint segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled touchpoint segment"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.clicks - this.priority) * 100) / 100;
  }

  copy(): ScheduledTouchpointSegment {
    return new ScheduledTouchpointSegment(
      this.code,
      this.title,
      this.cost,
      this.timezone,
      this.minimum,
      this.region,
      this.clicks,
      this.visible,
      this.endsAt,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled touchpoint segment in status created. */
export function newScheduledTouchpointSegment(code: string, title: string): ScheduledTouchpointSegment {
  return new ScheduledTouchpointSegment(code, title, 0, "", 0, "", 0, false, 0, 0, "created");
}
