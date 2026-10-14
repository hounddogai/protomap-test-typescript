import * as text from "../../../../kit/text.js";

/** Where a strict step milestone is in its life cycle. */
export type StrictStepMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict step milestone as the step team keeps it. */
export class StrictStepMilestone {
  code: string;
  name: string;
  graceDays: number;
  priority: number;
  impressions: number;
  minimum: number;
  visible: boolean;
  startsAt: number;
  discount: number;
  weight: number;
  margin: number;
  status: StrictStepMilestoneStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    priority: number,
    impressions: number,
    minimum: number,
    visible: boolean,
    startsAt: number,
    discount: number,
    weight: number,
    margin: number,
    status: StrictStepMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.priority = priority;
    this.impressions = impressions;
    this.minimum = minimum;
    this.visible = visible;
    this.startsAt = startsAt;
    this.discount = discount;
    this.weight = weight;
    this.margin = margin;
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

  canMoveTo(next: StrictStepMilestoneStatus): boolean {
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
          case "ready":
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

  moveTo(next: StrictStepMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict step milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.margin + this.priority) * 100) / 100;
  }

  copy(): StrictStepMilestone {
    return new StrictStepMilestone(
      this.code,
      this.name,
      this.graceDays,
      this.priority,
      this.impressions,
      this.minimum,
      this.visible,
      this.startsAt,
      this.discount,
      this.weight,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict step milestone in status idle. */
export function newStrictStepMilestone(code: string, name: string): StrictStepMilestone {
  return new StrictStepMilestone(code, name, 0, 0, 0, 0, false, 0, 0, 0, 0, "idle");
}
