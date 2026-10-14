import * as text from "../../../../kit/text.js";

/** Where a journey schedule is in its life cycle. */
export type JourneyScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A journey schedule as the journey team keeps it. */
export class JourneySchedule {
  code: string;
  label: string;
  updatedAt: number;
  audienceId: string;
  region: string;
  frequencyCap: number;
  country: string;
  source: string;
  status: JourneyScheduleStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    audienceId: string,
    region: string,
    frequencyCap: number,
    country: string,
    source: string,
    status: JourneyScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.audienceId = audienceId;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.country = country;
    this.source = source;
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

  canMoveTo(next: JourneyScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: JourneyScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.updatedAt + this.frequencyCap) * 100) / 100;
  }

  copy(): JourneySchedule {
    return new JourneySchedule(
      this.code,
      this.label,
      this.updatedAt,
      this.audienceId,
      this.region,
      this.frequencyCap,
      this.country,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a journey schedule in status idle. */
export function newJourneySchedule(code: string, label: string): JourneySchedule {
  return new JourneySchedule(code, label, 0, "", "", 0, "", "", "idle");
}
