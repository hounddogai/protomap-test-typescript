import * as text from "../../../../kit/text.js";

/** Where a default streak target is in its life cycle. */
export type DefaultStreakTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a default streak target and its current status. */
export class DefaultStreakTarget {
  code: string;
  label: string;
  durationMinutes: number;
  utmSource: string;
  impressions: number;
  quantity: number;
  status: DefaultStreakTargetStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    utmSource: string,
    impressions: number,
    quantity: number,
    status: DefaultStreakTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
    this.impressions = impressions;
    this.quantity = quantity;
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

  canMoveTo(next: DefaultStreakTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: DefaultStreakTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default streak target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"default streak target"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.quantity - this.durationMinutes) * 100) / 100;
  }

  copy(): DefaultStreakTarget {
    return new DefaultStreakTarget(
      this.code,
      this.label,
      this.durationMinutes,
      this.utmSource,
      this.impressions,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default streak target in status idle. */
export function newDefaultStreakTarget(code: string, label: string): DefaultStreakTarget {
  return new DefaultStreakTarget(code, label, 0, "", 0, 0, "idle");
}
