import * as text from "../../../../kit/text.js";

/** Where a strict preference plan is in its life cycle. */
export type StrictPreferencePlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict preference plan. Its code is unique within a tenant. */
export class StrictPreferencePlan {
  code: string;
  title: string;
  floorValue: number;
  rate: number;
  ceiling: number;
  channel: string;
  maximum: number;
  status: StrictPreferencePlanStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    rate: number,
    ceiling: number,
    channel: string,
    maximum: number,
    status: StrictPreferencePlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.rate = rate;
    this.ceiling = ceiling;
    this.channel = channel;
    this.maximum = maximum;
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

  canMoveTo(next: StrictPreferencePlanStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPreferencePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict preference plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict preference plan"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.floorValue - this.maximum) * 100) / 100;
  }

  copy(): StrictPreferencePlan {
    return new StrictPreferencePlan(
      this.code,
      this.title,
      this.floorValue,
      this.rate,
      this.ceiling,
      this.channel,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict preference plan in status idle. */
export function newStrictPreferencePlan(code: string, title: string): StrictPreferencePlan {
  return new StrictPreferencePlan(code, title, 0, 0, 0, "", 0, "idle");
}
