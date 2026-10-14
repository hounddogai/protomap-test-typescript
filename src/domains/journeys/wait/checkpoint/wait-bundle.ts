import * as text from "../../../../kit/text.js";

/** Where a wait bundle is in its life cycle. */
export type WaitBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One wait bundle, with what the planners need to act on it. */
export class WaitBundle {
  code: string;
  name: string;
  notes: string;
  rate: number;
  startsAt: number;
  bid: number;
  status: WaitBundleStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    rate: number,
    startsAt: number,
    bid: number,
    status: WaitBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.rate = rate;
    this.startsAt = startsAt;
    this.bid = bid;
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

  canMoveTo(next: WaitBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
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

  moveTo(next: WaitBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"wait bundle"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.startsAt - this.rate) * 100) / 100;
  }

  copy(): WaitBundle {
    return new WaitBundle(this.code, this.name, this.notes, this.rate, this.startsAt, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a wait bundle in status idle. */
export function newWaitBundle(code: string, name: string): WaitBundle {
  return new WaitBundle(code, name, "", 0, 0, 0, "idle");
}
