import * as text from "../../../../kit/text.js";

/** Where a fallback streak target is in its life cycle. */
export type FallbackStreakTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback streak target and its current status. */
export class FallbackStreakTarget {
  code: string;
  name: string;
  retries: number;
  ceiling: number;
  visible: boolean;
  attempts: number;
  windowDays: number;
  status: FallbackStreakTargetStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    ceiling: number,
    visible: boolean,
    attempts: number,
    windowDays: number,
    status: FallbackStreakTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.ceiling = ceiling;
    this.visible = visible;
    this.attempts = attempts;
    this.windowDays = windowDays;
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

  canMoveTo(next: FallbackStreakTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackStreakTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback streak target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback streak target"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.attempts - this.ceiling) * 100) / 100;
  }

  copy(): FallbackStreakTarget {
    return new FallbackStreakTarget(
      this.code,
      this.name,
      this.retries,
      this.ceiling,
      this.visible,
      this.attempts,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback streak target in status proposed. */
export function newFallbackStreakTarget(code: string, name: string): FallbackStreakTarget {
  return new FallbackStreakTarget(code, name, 0, 0, false, 0, 0, "proposed");
}
