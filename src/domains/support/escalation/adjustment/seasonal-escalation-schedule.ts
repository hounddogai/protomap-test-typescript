import * as text from "../../../../kit/text.js";

/** Where a seasonal escalation schedule is in its life cycle. */
export type SeasonalEscalationScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal escalation schedule, with what the planners need to act on it. */
export class SeasonalEscalationSchedule {
  code: string;
  name: string;
  rate: number;
  clicks: number;
  minimum: number;
  region: string;
  title: string;
  startsAt: number;
  priority: number;
  status: SeasonalEscalationScheduleStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    clicks: number,
    minimum: number,
    region: string,
    title: string,
    startsAt: number,
    priority: number,
    status: SeasonalEscalationScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.clicks = clicks;
    this.minimum = minimum;
    this.region = region;
    this.title = title;
    this.startsAt = startsAt;
    this.priority = priority;
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

  canMoveTo(next: SeasonalEscalationScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
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

  moveTo(next: SeasonalEscalationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal escalation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round(this.rate * this.minimum * 100) / 100;
  }

  copy(): SeasonalEscalationSchedule {
    return new SeasonalEscalationSchedule(
      this.code,
      this.name,
      this.rate,
      this.clicks,
      this.minimum,
      this.region,
      this.title,
      this.startsAt,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal escalation schedule in status idle. */
export function newSeasonalEscalationSchedule(code: string, name: string): SeasonalEscalationSchedule {
  return new SeasonalEscalationSchedule(code, name, 0, 0, 0, "", "", 0, 0, "idle");
}
