import * as text from "../../../../kit/text.js";

/** Where a weighted wait baseline is in its life cycle. */
export type WeightedWaitBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a weighted wait baseline and its current status. */
export class WeightedWaitBaseline {
  code: string;
  title: string;
  priority: number;
  cost: number;
  unit: string;
  endsAt: number;
  pinned: boolean;
  revision: number;
  status: WeightedWaitBaselineStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    cost: number,
    unit: string,
    endsAt: number,
    pinned: boolean,
    revision: number,
    status: WeightedWaitBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.cost = cost;
    this.unit = unit;
    this.endsAt = endsAt;
    this.pinned = pinned;
    this.revision = revision;
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

  canMoveTo(next: WeightedWaitBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedWaitBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted wait baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"weighted wait baseline"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.priority * this.revision * 100) / 100;
  }

  copy(): WeightedWaitBaseline {
    return new WeightedWaitBaseline(
      this.code,
      this.title,
      this.priority,
      this.cost,
      this.unit,
      this.endsAt,
      this.pinned,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted wait baseline in status idle. */
export function newWeightedWaitBaseline(code: string, title: string): WeightedWaitBaseline {
  return new WeightedWaitBaseline(code, title, 0, 0, "", 0, false, 0, "idle");
}
