/**
 * The global nudge window records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global nudge window is in its life cycle. */
export type GlobalNudgeWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One global nudge window, with what the planners need to act on it. */
export class GlobalNudgeWindow {
  code: string;
  name: string;
  maximum: number;
  active: boolean;
  graceDays: number;
  bid: number;
  startsAt: number;
  ratio: number;
  status: GlobalNudgeWindowStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    active: boolean,
    graceDays: number,
    bid: number,
    startsAt: number,
    ratio: number,
    status: GlobalNudgeWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.active = active;
    this.graceDays = graceDays;
    this.bid = bid;
    this.startsAt = startsAt;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalNudgeWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalNudgeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global nudge window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round(this.graceDays * this.maximum * 100) / 100;
  }

  copy(): GlobalNudgeWindow {
    return new GlobalNudgeWindow(
      this.code,
      this.name,
      this.maximum,
      this.active,
      this.graceDays,
      this.bid,
      this.startsAt,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global nudge window in status proposed. */
export function newGlobalNudgeWindow(code: string, name: string): GlobalNudgeWindow {
  return new GlobalNudgeWindow(code, name, 0, false, 0, 0, 0, 0, "proposed");
}
