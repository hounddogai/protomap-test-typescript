/**
 * The nudge snapshot records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge snapshot is in its life cycle. */
export type NudgeSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A nudge snapshot as the nudge team keeps it. */
export class NudgeSnapshot {
  code: string;
  title: string;
  country: string;
  conversionRate: number;
  sendAt: number;
  status: NudgeSnapshotStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    conversionRate: number,
    sendAt: number,
    status: NudgeSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
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

  canMoveTo(next: NudgeSnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.sendAt + this.conversionRate) * 100) / 100;
  }

  copy(): NudgeSnapshot {
    return new NudgeSnapshot(this.code, this.title, this.country, this.conversionRate, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a nudge snapshot in status idle. */
export function newNudgeSnapshot(code: string, title: string): NudgeSnapshot {
  return new NudgeSnapshot(code, title, "", 0, 0, "idle");
}
