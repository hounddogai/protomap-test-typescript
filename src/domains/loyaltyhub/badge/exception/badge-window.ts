import * as text from "../../../../kit/text.js";

/** Where a badge window is in its life cycle. */
export type BadgeWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a badge window and its current status. */
export class BadgeWindow {
  code: string;
  title: string;
  minimum: number;
  bid: number;
  channel: string;
  revision: number;
  budget: number;
  capacity: number;
  pinned: boolean;
  timezone: string;
  ownerId: string;
  status: BadgeWindowStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    bid: number,
    channel: string,
    revision: number,
    budget: number,
    capacity: number,
    pinned: boolean,
    timezone: string,
    ownerId: string,
    status: BadgeWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.bid = bid;
    this.channel = channel;
    this.revision = revision;
    this.budget = budget;
    this.capacity = capacity;
    this.pinned = pinned;
    this.timezone = timezone;
    this.ownerId = ownerId;
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

  canMoveTo(next: BadgeWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BadgeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"badge window"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.budget - this.bid) * 100) / 100;
  }

  copy(): BadgeWindow {
    return new BadgeWindow(
      this.code,
      this.title,
      this.minimum,
      this.bid,
      this.channel,
      this.revision,
      this.budget,
      this.capacity,
      this.pinned,
      this.timezone,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a badge window in status idle. */
export function newBadgeWindow(code: string, title: string): BadgeWindow {
  return new BadgeWindow(code, title, 0, 0, "", 0, 0, 0, false, "", "", "idle");
}
