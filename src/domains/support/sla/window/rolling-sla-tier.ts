import * as text from "../../../../kit/text.js";

/** Where a rolling sla tier is in its life cycle. */
export type RollingSlaTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling sla tier, with what the planners need to act on it. */
export class RollingSlaTier {
  code: string;
  label: string;
  priority: number;
  attempts: number;
  floorValue: number;
  country: string;
  status: RollingSlaTierStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    attempts: number,
    floorValue: number,
    country: string,
    status: RollingSlaTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.attempts = attempts;
    this.floorValue = floorValue;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingSlaTierStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingSlaTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling sla tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.attempts * this.priority * 100) / 100;
  }

  copy(): RollingSlaTier {
    return new RollingSlaTier(
      this.code,
      this.label,
      this.priority,
      this.attempts,
      this.floorValue,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a rolling sla tier in status planned. */
export function newRollingSlaTier(code: string, label: string): RollingSlaTier {
  return new RollingSlaTier(code, label, 0, 0, 0, "", "planned");
}
