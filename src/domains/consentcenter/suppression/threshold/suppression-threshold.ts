/**
 * The suppression threshold records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression threshold is in its life cycle. */
export type SuppressionThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One suppression threshold, with what the planners need to act on it. */
export class SuppressionThreshold {
  code: string;
  name: string;
  archived: boolean;
  attempts: number;
  minimum: number;
  timezone: string;
  status: SuppressionThresholdStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    attempts: number,
    minimum: number,
    timezone: string,
    status: SuppressionThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.attempts = attempts;
    this.minimum = minimum;
    this.timezone = timezone;
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

  canMoveTo(next: SuppressionThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: SuppressionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.attempts * this.minimum * 100) / 100;
  }

  copy(): SuppressionThreshold {
    return new SuppressionThreshold(
      this.code,
      this.name,
      this.archived,
      this.attempts,
      this.minimum,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a suppression threshold in status idle. */
export function newSuppressionThreshold(code: string, name: string): SuppressionThreshold {
  return new SuppressionThreshold(code, name, false, 0, 0, "", "idle");
}
