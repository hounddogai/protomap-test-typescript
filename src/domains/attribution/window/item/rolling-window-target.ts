import * as text from "../../../../kit/text.js";

/** Where a rolling window target is in its life cycle. */
export type RollingWindowTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling window target and its current status. */
export class RollingWindowTarget {
  code: string;
  title: string;
  ceiling: number;
  priority: number;
  weight: number;
  status: RollingWindowTargetStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    priority: number,
    weight: number,
    status: RollingWindowTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.priority = priority;
    this.weight = weight;
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

  canMoveTo(next: RollingWindowTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
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

  moveTo(next: RollingWindowTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling window target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round((this.priority - this.ceiling) * 100) / 100;
  }

  copy(): RollingWindowTarget {
    return new RollingWindowTarget(this.code, this.title, this.ceiling, this.priority, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling window target in status idle. */
export function newRollingWindowTarget(code: string, title: string): RollingWindowTarget {
  return new RollingWindowTarget(code, title, 0, 0, 0, "idle");
}
