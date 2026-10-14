import * as text from "../../../../kit/text.js";

/** Where a wait schedule is in its life cycle. */
export type WaitScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A wait schedule as the wait team keeps it. */
export class WaitSchedule {
  code: string;
  name: string;
  floorValue: number;
  utmSource: string;
  version: number;
  weight: number;
  channel: string;
  region: string;
  maximum: number;
  status: WaitScheduleStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    utmSource: string,
    version: number,
    weight: number,
    channel: string,
    region: string,
    maximum: number,
    status: WaitScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.utmSource = utmSource;
    this.version = version;
    this.weight = weight;
    this.channel = channel;
    this.region = region;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WaitScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round(this.floorValue * this.maximum * 100) / 100;
  }

  copy(): WaitSchedule {
    return new WaitSchedule(
      this.code,
      this.name,
      this.floorValue,
      this.utmSource,
      this.version,
      this.weight,
      this.channel,
      this.region,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a wait schedule in status open. */
export function newWaitSchedule(code: string, name: string): WaitSchedule {
  return new WaitSchedule(code, name, 0, "", 0, 0, "", "", 0, "open");
}
