/**
 * The post schedule records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post schedule is in its life cycle. */
export type PostScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A post schedule as the post team keeps it. */
export class PostSchedule {
  code: string;
  name: string;
  windowDays: number;
  score: number;
  endsAt: number;
  status: PostScheduleStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    score: number,
    endsAt: number,
    status: PostScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.score = score;
    this.endsAt = endsAt;
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

  canMoveTo(next: PostScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"post schedule"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.endsAt * this.windowDays * 100) / 100;
  }

  copy(): PostSchedule {
    return new PostSchedule(this.code, this.name, this.windowDays, this.score, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a post schedule in status idle. */
export function newPostSchedule(code: string, name: string): PostSchedule {
  return new PostSchedule(code, name, 0, 0, 0, "idle");
}
