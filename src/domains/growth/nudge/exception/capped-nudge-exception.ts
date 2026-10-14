/**
 * The capped nudge exception records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped nudge exception is in its life cycle. */
export type CappedNudgeExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped nudge exception as the nudge team keeps it. */
export class CappedNudgeException {
  code: string;
  label: string;
  priority: number;
  openRate: number;
  clicks: number;
  status: CappedNudgeExceptionStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    openRate: number,
    clicks: number,
    status: CappedNudgeExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.openRate = openRate;
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

  canMoveTo(next: CappedNudgeExceptionStatus): boolean {
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

  moveTo(next: CappedNudgeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped nudge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round((this.priority - this.clicks) * 100) / 100;
  }

  copy(): CappedNudgeException {
    return new CappedNudgeException(this.code, this.label, this.priority, this.openRate, this.clicks, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped nudge exception in status idle. */
export function newCappedNudgeException(code: string, label: string): CappedNudgeException {
  return new CappedNudgeException(code, label, 0, 0, 0, "idle");
}
