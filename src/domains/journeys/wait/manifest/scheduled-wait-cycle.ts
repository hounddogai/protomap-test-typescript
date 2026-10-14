import * as text from "../../../../kit/text.js";

/** Where a scheduled wait cycle is in its life cycle. */
export type ScheduledWaitCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled wait cycle as the wait team keeps it. */
export class ScheduledWaitCycle {
  code: string;
  title: string;
  country: string;
  minimum: number;
  contactEmail: string;
  clicks: number;
  status: ScheduledWaitCycleStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    minimum: number,
    contactEmail: string,
    clicks: number,
    status: ScheduledWaitCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.clicks = clicks;
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

  canMoveTo(next: ScheduledWaitCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: ScheduledWaitCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled wait cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled wait cycle"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.minimum - this.clicks) * 100) / 100;
  }

  copy(): ScheduledWaitCycle {
    return new ScheduledWaitCycle(
      this.code,
      this.title,
      this.country,
      this.minimum,
      this.contactEmail,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled wait cycle in status idle. */
export function newScheduledWaitCycle(code: string, title: string): ScheduledWaitCycle {
  return new ScheduledWaitCycle(code, title, "", 0, "", 0, "idle");
}
