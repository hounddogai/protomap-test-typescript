import * as text from "../../../../kit/text.js";

/** Where a path milestone is in its life cycle. */
export type PathMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One path milestone, with what the planners need to act on it. */
export class PathMilestone {
  code: string;
  name: string;
  channel: string;
  priority: number;
  startsAt: number;
  discount: number;
  status: PathMilestoneStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    priority: number,
    startsAt: number,
    discount: number,
    status: PathMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.priority = priority;
    this.startsAt = startsAt;
    this.discount = discount;
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

  canMoveTo(next: PathMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: PathMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.priority - this.startsAt) * 100) / 100;
  }

  copy(): PathMilestone {
    return new PathMilestone(
      this.code,
      this.name,
      this.channel,
      this.priority,
      this.startsAt,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a path milestone in status idle. */
export function newPathMilestone(code: string, name: string): PathMilestone {
  return new PathMilestone(code, name, "", 0, 0, 0, "idle");
}
