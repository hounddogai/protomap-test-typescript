import * as text from "../../../../kit/text.js";

/** Where a window cycle is in its life cycle. */
export type WindowCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A window cycle. Its code is unique within a tenant. */
export class WindowCycle {
  code: string;
  title: string;
  ceiling: number;
  batchSize: number;
  durationMinutes: number;
  status: WindowCycleStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    batchSize: number,
    durationMinutes: number,
    status: WindowCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.batchSize = batchSize;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: WindowCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: WindowCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"window cycle"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.durationMinutes - this.batchSize) * 100) / 100;
  }

  copy(): WindowCycle {
    return new WindowCycle(this.code, this.title, this.ceiling, this.batchSize, this.durationMinutes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a window cycle in status idle. */
export function newWindowCycle(code: string, title: string): WindowCycle {
  return new WindowCycle(code, title, 0, 0, 0, "idle");
}
