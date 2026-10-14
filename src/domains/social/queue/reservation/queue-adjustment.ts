import * as text from "../../../../kit/text.js";

/** Where a queue adjustment is in its life cycle. */
export type QueueAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One queue adjustment, with what the planners need to act on it. */
export class QueueAdjustment {
  code: string;
  name: string;
  floorValue: number;
  locale: string;
  threshold: number;
  status: QueueAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    locale: string,
    threshold: number,
    status: QueueAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.locale = locale;
    this.threshold = threshold;
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

  canMoveTo(next: QueueAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
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

  moveTo(next: QueueAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round(this.floorValue * this.threshold * 100) / 100;
  }

  copy(): QueueAdjustment {
    return new QueueAdjustment(this.code, this.name, this.floorValue, this.locale, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a queue adjustment in status idle. */
export function newQueueAdjustment(code: string, name: string): QueueAdjustment {
  return new QueueAdjustment(code, name, 0, "", 0, "idle");
}
