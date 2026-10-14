import * as text from "../../../../kit/text.js";

/** Where a touchpoint schedule is in its life cycle. */
export type TouchpointScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a touchpoint schedule and its current status. */
export class TouchpointSchedule {
  code: string;
  name: string;
  clicks: number;
  minimum: number;
  audienceId: string;
  status: TouchpointScheduleStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    minimum: number,
    audienceId: string,
    status: TouchpointScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.minimum = minimum;
    this.audienceId = audienceId;
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

  canMoveTo(next: TouchpointScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TouchpointScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.minimum - this.clicks) * 100) / 100;
  }

  copy(): TouchpointSchedule {
    return new TouchpointSchedule(this.code, this.name, this.clicks, this.minimum, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a touchpoint schedule in status draft. */
export function newTouchpointSchedule(code: string, name: string): TouchpointSchedule {
  return new TouchpointSchedule(code, name, 0, 0, "", "draft");
}
