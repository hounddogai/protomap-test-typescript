import * as text from "../../../../kit/text.js";

/** Where a capped touchpoint schedule is in its life cycle. */
export type CappedTouchpointScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped touchpoint schedule as the touchpoint team keeps it. */
export class CappedTouchpointSchedule {
  code: string;
  title: string;
  archived: boolean;
  pinned: boolean;
  channel: string;
  startsAt: number;
  status: CappedTouchpointScheduleStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    pinned: boolean,
    channel: string,
    startsAt: number,
    status: CappedTouchpointScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.pinned = pinned;
    this.channel = channel;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedTouchpointScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedTouchpointScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped touchpoint schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): CappedTouchpointSchedule {
    return new CappedTouchpointSchedule(
      this.code,
      this.title,
      this.archived,
      this.pinned,
      this.channel,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped touchpoint schedule in status planned. */
export function newCappedTouchpointSchedule(code: string, title: string): CappedTouchpointSchedule {
  return new CappedTouchpointSchedule(code, title, false, false, "", 0, "planned");
}
